import http from "node:http";
import zlib from "node:zlib";
import assert from "node:assert/strict";

const PAGE = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>Base44 app</title>
  <meta name="description" content="old description">
  <link rel="canonical" href="https://old.example/">
  <link rel="icon" href="/favicon.ico">
</head>
<body>
  <div class="w-full border-t border-border"></div>
  <div class="min-w-0"><div class="font-mono text-[9px] tracking-widest text-zinc-data">РЕЙТИНГ</div></div>
  <label class="font-mono text-[9px] tracking-widest text-zinc-data block mb-1">РЕЙТИНГ</label>
  <div class="font-mono text-[9px] tracking-[0.2em] text-zinc-data">СЭКОНОМЛЕНО ВРЕМЕНИ</div>
  <span class="font-mono text-[10px] tracking-widest text-gold">// ОТВЕТИТЬ (поддерживается Markdown)</span>
  <textarea placeholder="x"></textarea>
  <input placeholder="PEGI 18 / 18+">
  <script>var a = 1 < 2 && "ok";</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname === "/api/users") {
    res.writeHead(200, {
      "content-type": "application/json",
      "content-encoding": "gzip",
    });
    res.end(zlib.gzipSync(Buffer.from(JSON.stringify({ ok: true, path: url.pathname }))));
    return;
  }

  if (url.pathname === "/ws-user-apps/app") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(PAGE);
    return;
  }

  // main + login-proxy target
  res.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "content-encoding": "gzip",
    "x-robots-tag": "noindex",
    "x-frame-options": "DENY",
    "content-security-policy": "default-src 'self'",
  });
  res.end(zlib.gzipSync(Buffer.from(PAGE)));
});

await new Promise((resolve) => server.listen(0, resolve));
const origin = `http://localhost:${server.address().port}`;

process.env.UPSTREAM_MAIN = origin;
process.env.UPSTREAM_API = origin;
process.env.UPSTREAM_TERMINAL = origin;

const { default: handler } = await import("../api/proxy.js");

async function call(path, init) {
  const request = new Request(`https://regruha.vercel.app${path}`, init);
  return handler.fetch(request);
}

// 1. Главная страница
{
  const res = await call("/");
  const html = await res.text();
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-encoding"), null, "content-encoding должен быть удалён");
  assert.equal(res.headers.get("content-security-policy"), "frame-ancestors *;");
  assert.equal(res.headers.get("x-frame-options"), null);
  assert.equal(res.headers.get("x-robots-tag"), null);
  assert.ok(html.includes("<title>Regruha — T-Regruha</title>"), "новый title");
  assert.ok(!html.includes("Base44 app"), "старый title удалён");
  assert.ok(!html.includes("old description"), "старый description удалён");
  assert.ok(html.includes('rel="canonical" href="https://regruha.vercel.app/"'), "canonical");
  assert.ok(!html.includes("w-full border-t border-border"), "разделитель удалён");
  assert.ok(html.includes("ОЦЕНКА METACRITIC"), "РЕЙТИНГ заменён");
  assert.ok(!html.includes(">РЕЙТИНГ<"), "старого РЕЙТИНГ нет");
  assert.ok(html.includes("СЭКОНОМЛЕНО ВРЕМЕНИ В ИГРЕ"), "время в игре");
  assert.ok(html.includes("// ОТВЕТИТЬ)"), "span ответить");
  assert.ok(html.includes('placeholder="Напишите ответ..."'), "textarea placeholder");
  assert.ok(html.includes('placeholder="7.2/10"'), "input placeholder");
  assert.ok(html.includes('application/ld+json'), "json-ld");
  assert.ok(html.includes('google-site-verification'), "google verification meta");
  console.log("✓ главная страница перезаписана");
}

// 2. robots.txt
{
  const res = await call("/robots.txt");
  const body = await res.text();
  assert.equal(res.status, 200);
  assert.ok(body.includes("Sitemap: https://regruha.vercel.app/sitemap.xml"));
  console.log("✓ robots.txt");
}

// 3. sitemap.xml
{
  const res = await call("/sitemap.xml");
  const body = await res.text();
  assert.ok(body.includes("<loc>https://regruha.vercel.app/</loc>"));
  console.log("✓ sitemap.xml");
}

// 4. google verification
{
  const res = await call("/google14337db78de6911c.html");
  assert.equal(await res.text(), "google-site-verification: google14337db78de6911c.html");
  console.log("✓ google verification");
}

// 5. API proxy
{
  const res = await call("/api/users");
  const json = await res.json();
  assert.deepEqual(json, { ok: true, path: "/api/users" });
  assert.equal(res.headers.get("content-encoding"), null);
  console.log("✓ /api/* проксируется");
}

// 6. OAuth login redirect
{
  const res = await call("/api/apps/auth/login?app_id=abc");
  assert.equal(res.status, 302);
  const location = res.headers.get("location");
  assert.ok(location.startsWith("https://app.base44.com/api/apps/auth/login?"), location);
  assert.ok(location.includes("app_id=abc"));
  assert.ok(location.includes("from_url=https%3A%2F%2Fregruha.vercel.app%2F"));
  console.log("✓ OAuth login redirect");
}

// 6b. login без app_id
{
  const res = await call("/api/apps/auth/login");
  assert.equal(res.status, 400);
  console.log("✓ OAuth login без app_id -> 400");
}

// 7. ws-user-apps
{
  const res = await call("/ws-user-apps/app");
  const html = await res.text();
  assert.ok(html.includes("#base44-badge,#base44-edit-badge{display:none !important;}"));
  console.log("✓ /ws-user-apps/* + скрытие бейджа");
}

// 8. favicon
{
  const res = await call("/favicon.png");
  assert.equal(res.status, 302);
  assert.ok(res.headers.get("location").includes("favicon.png"));
  console.log("✓ /favicon.png redirect");
}

// 9. Не-HTML ответ главного прокси отдаётся байт-в-байт без content-encoding
{
  const res = await call("/something.js");
  assert.equal(res.headers.get("content-encoding"), null);
  console.log("✓ не-HTML проходит через главный прокси");
}

// 10. Страховка: если transform request.path не сработал, путь берём из заголовка
{
  const request = new Request("https://regruha.vercel.app/api/proxy", {
    headers: { "x-regruha-original-path": "/robots.txt" },
  });
  const res = await handler.fetch(request);
  const body = await res.text();
  assert.ok(body.includes("Sitemap: https://regruha.vercel.app/sitemap.xml"), "путь из заголовка");
  console.log("✓ fallback по заголовку x-regruha-original-path");
}

// 11. Публичный домен берётся из x-forwarded-host (custom domain)
{
  const request = new Request("https://internal.vercel.app/", {
    headers: {
      "x-forwarded-host": "regruha.example.com",
      "x-forwarded-proto": "https",
    },
  });
  const res = await handler.fetch(request);
  const html = await res.text();
  assert.ok(
    html.includes('rel="canonical" href="https://regruha.example.com/"'),
    "canonical с custom domain"
  );
  console.log("✓ x-forwarded-host используется как публичный домен");
}

server.close();
console.log("\nВсе проверки пройдены.");

export default async function handler(req, res) {
  const incoming = new URL(req.url, `https://${req.headers.host || "localhost"}`);
  const siteUrl = `${incoming.protocol}//${incoming.host}`;

  if (incoming.pathname === "/google14337db78de6911c.html") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end("google-site-verification: google14337db78de6911c.html");
  }

  if (incoming.pathname === "/robots.txt") {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.end(`User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml`);
  }

  if (incoming.pathname === "/sitemap.xml") {
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    return res.end(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${siteUrl}/</loc><lastmod>${new Date().toISOString().split("T")[0]}</lastmod></url>
</urlset>`);
  }

  const target = new URL(incoming.toString());
  target.hostname = "regruha.base44.app";
  target.searchParams.set("v", "2");

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value != null && !["host", "content-length"].includes(key.toLowerCase())) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
  }
  headers.set("accept-encoding", "identity");

  let body;
  if (!["GET", "HEAD"].includes(req.method)) {
    body = await readBody(req);
  }

  const response = await fetch(target, {
    method: req.method,
    headers,
    body,
    redirect: "follow",
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("x-robots-tag");
  responseHeaders.delete("x-frame-options");
  responseHeaders.delete("content-security-policy");

  const contentType = response.headers.get("content-type") || "";
  let output;

  if (contentType.includes("text/html")) {
    let html = await response.text();

    html = html
      .replace(/<link[^>]+(?:rel=["'](?:icon|shortcut icon|apple-touch-icon|canonical)["'])[^>]*>\s*/gi, "")
      .replace(/<meta[^>]+name=["']description["'][^>]*>\s*/gi, "")
      .replace(/<title[^>]*>[\s\S]*?<\/title>\s*/gi, "")
      .replace(/<div[^>]*class=["'][^"']*w-full border-t border-border[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, "")
      .replace(/<textarea([^>]*)>/gi, '<textarea$1 placeholder="Напишите ответ...">')
      .replace(/PEGI 18 \/ 18\+/g, "7.2/10")
      .replace(/>РЕЙТИНГ</g, ">ОЦЕНКА METACRITIC</g");

    const injection = `
<script>
(function () {
  function patch() {
    document.querySelectorAll('#base44-badge,#base44-edit-badge').forEach(e => e.remove());
    document.querySelectorAll('div.w-full.border-t.border-border').forEach(e => e.remove());
    document.querySelectorAll('button').forEach(btn => {
      if ((btn.textContent || '').includes('Continue with Google')) btn.style.display='none';
    });
    document.querySelectorAll('textarea').forEach(e => e.setAttribute('placeholder','Напишите ответ...'));
    document.querySelectorAll('input[placeholder="PEGI 18 / 18+"]').forEach(e => e.setAttribute('placeholder','7.2/10'));
    document.querySelectorAll('div.min-w-0 > div, label').forEach(e => {
      if ((e.textContent || '').trim() === 'РЕЙТИНГ') e.textContent='ОЦЕНКА METACRITIC';
    });
  }
  patch();
  new MutationObserver(patch).observe(document.documentElement, {childList:true,subtree:true});
})();
</script>
<style>
#base44-badge,#base44-edit-badge{display:none!important}
</style>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="google-site-verification" content="google14337db78de6911c">
<title>Regruha — T-Regruha</title>
<meta name="description" content="Regruha / T-Regruha — официальный сайт проекта.">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<link rel="canonical" href="${siteUrl}/">
<link rel="icon" type="image/png" href="/favicon.png">
<meta property="og:site_name" content="Regruha">
<meta property="og:title" content="Regruha — T-Regruha">
<meta property="og:description" content="Regruha / T-Regruha — официальный сайт проекта.">
<meta property="og:image" content="https://github.com/Rusmer/regruha/blob/main/functions/favicon.png?raw=true">
<meta property="og:type" content="website">
<meta property="og:url" content="${siteUrl}/">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Regruha — T-Regruha">
<meta name="twitter:description" content="Regruha / T-Regruha — официальный сайт проекта.">
<meta name="twitter:image" content="https://github.com/Rusmer/regruha/blob/main/functions/favicon.png?raw=true">
`;

    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head([^>]*)>/i, `<head$1>${injection}`);
    } else {
      html = injection + html;
    }
    output = html;
    responseHeaders.set("content-type", "text/html; charset=utf-8");
  } else {
    output = Buffer.from(await response.arrayBuffer());
  }

  res.statusCode = response.status;
  for (const [key, value] of responseHeaders) res.setHeader(key, value);
  return res.end(output);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const UPSTREAM = "https://regruha.base44.app";

function verificationResponse() {
  return new Response("google-site-verification: google14337db78de6911c.html", {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function robotsResponse(siteUrl) {
  return new Response(`User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml`, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

function sitemapResponse(siteUrl) {
  const today = new Date().toISOString().split("T")[0];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${today}</lastmod>
  </url>
</urlset>`, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}

function transformHtml(html, siteUrl) {
  const title = "Regruha — T-Regruha";
  const description = "Regruha / T-Regruha — официальный сайт проекта.";
  const image = `${siteUrl}/favicon.png`;

  // Keep the same client-side behavior as the original Cloudflare Pages worker.
  const clientPatch = `
<script>
(function () {
  const hideElements = () => {
    document.querySelectorAll('div.w-full.border-t.border-border').forEach(el => el.remove());

    document.querySelectorAll('button').forEach(btn => {
      if (btn.textContent && btn.textContent.includes('Continue with Google')) {
        btn.style.setProperty('display', 'none', 'important');
      }
    });

    document.querySelectorAll('div.uppercase span').forEach(span => {
      if (span.textContent && span.textContent.trim() === 'or') {
        const parentDiv = span.closest('div.relative');
        if (parentDiv) parentDiv.style.setProperty('display', 'none', 'important');
      }
    });

    document.querySelectorAll('div.min-w-0 > div.font-mono.text-\\\\[9px\\\\].tracking-widest.text-zinc-data')
      .forEach(el => {
        if (el.textContent && el.textContent.trim() === 'РЕЙТИНГ') {
          el.textContent = 'ОЦЕНКА METACRITIC';
        }
      });

    document.querySelectorAll('label.font-mono.text-\\\\[9px\\\\].tracking-widest.text-zinc-data.block.mb-1')
      .forEach(el => {
        if (el.textContent && el.textContent.trim() === 'РЕЙТИНГ') {
          el.textContent = 'ОЦЕНКА METACRITIC';
        }
      });

    document.querySelectorAll('div.absolute.top-0.right-0.bg-gold.text-\\\\[\\\\#050505\\\\].font-mono.text-\\\\[10px\\\\].font-bold.tracking-widest.px-3.py-1.z-20')
      .forEach(el => {
        if (el.textContent && el.textContent.trim() === 'ОЖИДАЕМЫЙ РЕЛИЗ') {
          el.textContent = 'ИЗБРАННОЕ';
        }
      });

    document.querySelectorAll('textarea').forEach(el => {
      el.setAttribute('placeholder', 'Напишите ответ...');
    });

    document.querySelectorAll('input[placeholder="PEGI 18 / 18+"]').forEach(el => {
      el.setAttribute('placeholder', '7.2/10');
    });
  };

  hideElements();
  new MutationObserver(hideElements).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
</script>
<style>
#base44-badge, #base44-edit-badge { display: none !important; }
button:has(svg path[fill="#4285F4"]),
div.uppercase:has(span) {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}
</style>`;

  // These replacements cover the server-side HTMLRewriter rules from the original.
  html = html
    .replace(/<link\b[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon|canonical)["'][^>]*>\s*/gi, "")
    .replace(/<link\b[^>]*rel=["'][^"']*(?:icon|canonical)[^"']*["'][^>]*>\s*/gi, "")
    .replace(/<meta\b[^>]*name=["']description["'][^>]*>\s*/gi, "")
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "")
    .replace(/<div\b[^>]*class=["'][^"']*\bw-full\b[^"']*\bborder-t\b[^"']*\bborder-border\b[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, "")
    .replace(/(<textarea\b[^>]*)(>)/gi, '$1 placeholder="Напишите ответ..."$2')
    .replace(/(placeholder=["'])PEGI 18 \/ 18\+(["'])/gi, '$17.2/10$2')
    .replace(/(<span\b[^>]*class=["'][^"']*\bfont-mono\b[^"']*\btext-\[10px\][^"']*\btracking-widest\b[^"']*\btext-gold\b[^"']*["'][^>]*>)[\s\S]*?(<\/span>)/gi,
      (m, open, close) => m.includes("// ОТВЕТИТЬ (поддерживается Markdown)") ? `${open}// ОТВЕТИТЬ)${close}` : m)
    .replace(/(<div\b[^>]*class=["'][^"']*\bmin-w-0\b[^"']*["'][^>]*>\s*<div\b[^>]*class=["'][^"']*\bfont-mono\b[^"']*\btext-\[9px\][^"']*\btracking-widest\b[^"']*\btext-zinc-data\b[^"']*["'][^>]*>)[\s\S]*?(<\/div>)/gi,
      (m, open, close) => /РЕЙТИНГ/.test(m) ? `${open}ОЦЕНКА METACRITIC${close}` : m)
    .replace(/(<label\b[^>]*class=["'][^"']*\bfont-mono\b[^"']*\btext-\[9px\][^"']*\btracking-widest\b[^"']*\btext-zinc-data\b[^"']*\bblock\b[^"']*\bmb-1\b[^"']*["'][^>]*>)[\s\S]*?(<\/label>)/gi,
      (m, open, close) => /РЕЙТИНГ/.test(m) ? `${open}ОЦЕНКА METACRITIC${close}` : m);

  const head = `
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="google-site-verification" content="google14337db78de6911c.html">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<meta name="googlebot" content="index, follow">
<link rel="canonical" href="${siteUrl}/">
<link rel="icon" type="image/png" href="${image}" sizes="32x32">
<link rel="shortcut icon" href="${image}">
<link rel="apple-touch-icon" href="${image}">
<meta property="og:site_name" content="Regruha">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${image}">
<meta property="og:type" content="website">
<meta property="og:url" content="${siteUrl}/">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Regruha",
    alternateName: "T-Regruha",
    url: `${siteUrl}/`,
    description
  })}</script>
${clientPatch}`;

  if (/<head\b[^>]*>/i.test(html)) {
    html = html.replace(/<head\b[^>]*>/i, match => `${match}${head}`);
  } else {
    html = `<!doctype html><html><head>${head}</head><body>${html}</body></html>`;
  }

  return html;
}

export default async function handler(request) {
  const incoming = new URL(request.url);
  const siteUrl = `${incoming.protocol}//${incoming.host}`;

  if (incoming.pathname === "/google14337db78de6911c.html") return verificationResponse();
  if (incoming.pathname === "/robots.txt") return robotsResponse(siteUrl);
  if (incoming.pathname === "/sitemap.xml") return sitemapResponse(siteUrl);

  // The rewrite stores the original pathname in ?path=. Rebuild the upstream URL
  // while retaining the user's original query parameters.
  const originalPath = incoming.pathname.replace(/^\/api\/site(?=\/|$)/, "") || "/";
  const upstreamUrl = new URL(UPSTREAM);
  upstreamUrl.pathname = originalPath.startsWith("/") ? originalPath : `/${originalPath}`;
  upstreamUrl.search = "";
  for (const [key, value] of incoming.searchParams) {
    upstreamUrl.searchParams.append(key, value);
  }
  upstreamUrl.searchParams.set("v", "2");

  const init = {
    method: request.method,
    headers: request.headers,
    redirect: "follow",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const response = await fetch(upstreamUrl, init);
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.toLowerCase().includes("text/html")) {
    return response;
  }

  const html = await response.text();
  const transformed = transformHtml(html, siteUrl);
  const headers = new Headers(response.headers);

  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("x-robots-tag");
  headers.delete("x-frame-options");
  headers.delete("content-security-policy");
  headers.set("content-security-policy", "frame-ancestors *;");
  headers.set("content-type", "text/html; charset=utf-8");

  return new Response(transformed, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

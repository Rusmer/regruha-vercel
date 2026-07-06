const UPSTREAM = "regruha-terminal-core.base44.app";
const IMAGE = "https://github.com/Rusmer/regruha/blob/main/functions/favicon.png?raw=true";
const TITLE = "Regruha — T-Regruha";
const DESCRIPTION = "Regruha / T-Regruha — официальный сайт проекта.";

export default async function handler(req, res) {
  const incomingUrl = new URL(req.url);
  const siteUrl = `${incomingUrl.protocol}//${incomingUrl.host}`;

  if (incomingUrl.pathname === "/google14337db78de6911c.html") {
    return res.status(200).setHeader("content-type", "text/html; charset=utf-8").send(
      "google-site-verification: google14337db78de6911c.html"
    );
  }

  if (incomingUrl.pathname === "/robots.txt") {
    return res.status(200).setHeader("content-type", "text/plain; charset=utf-8").send(
`User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml`
    );
  }

  if (incomingUrl.pathname === "/sitemap.xml") {
    return res.status(200).setHeader("content-type", "application/xml; charset=utf-8").send(
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
  </url>
</urlset>`
    );
  }

  const url = new URL(req.url);
  url.hostname = UPSTREAM;
  url.searchParams.set("v", "2");

  const response = await fetch(url.toString(), {
    method: req.method,
    headers: req.headers,
    body: req.method === "GET" || req.method === "HEAD" ? null : req,
    redirect: "follow",
  });

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    res.status(response.status);
    response.headers.forEach((v, k) => res.setHeader(k, v));
    return res.send(await response.text());
  }

  let html = await response.text();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Regruha",
    alternateName: "T-Regruha",
    url: `${siteUrl}/`,
    description: DESCRIPTION,
  };

  html = html
    .replace(/<link[^>]+rel=["'](?:icon|shortcut icon|apple-touch-icon|canonical)["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']description["'][^>]*>\s*/gi, "")
    .replace(/<title>.*?<\/title>/is, "")
    .replace(
      /<head([^>]*)>/i,
      `<head$1>
<style>
#base44-badge,
#base44-edit-badge { display: none !important; }
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
</style>
<script>
(function() {
  const hideElements = () => {
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
  };
  hideElements();
  new MutationObserver(hideElements).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
</script>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="google-site-verification" content="google14337db78de6911c.html">
<title>${TITLE}</title>
<meta name="description" content="${DESCRIPTION}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<meta name="googlebot" content="index, follow">
<link rel="canonical" href="${siteUrl}/">
<link rel="icon" type="image/png" href="${IMAGE}" sizes="32x32">
<link rel="shortcut icon" href="${IMAGE}">
<link rel="apple-touch-icon" href="${IMAGE}">
<meta property="og:site_name" content="Regruha">
<meta property="og:title" content="${TITLE}">
<meta property="og:description" content="${DESCRIPTION}">
<meta property="og:image" content="${IMAGE}">
<meta property="og:type" content="website">
<meta property="og:url" content="${siteUrl}/">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${TITLE}">
<meta name="twitter:description" content="${DESCRIPTION}">
<meta name="twitter:image" content="${IMAGE}">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`
    );

  res.status(response.status);
  res.setHeader("content-security-policy", "frame-ancestors *;");
  res.setHeader("content-type", "text/html; charset=utf-8");
  return res.send(html);
}

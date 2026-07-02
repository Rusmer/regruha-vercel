export default async function handler(req, res) {
  try {
    const incomingUrl = new URL(req.url, `https://${req.headers.host}`);
    const siteUrl = `${incomingUrl.protocol}//${incomingUrl.host}`;

    const image = "https://github.com/Rusmer/regruha/blob/main/functions/favicon.png?raw=true";
    const title = "Regruha — T-Regruha";
    const description = "Regruha / T-Regruha — официальный сайт проекта.";

    if (incomingUrl.pathname === "/google14337db78de6911c.html") {
      res.setHeader("content-type", "text/html; charset=utf-8");
      return res.status(200).send("google-site-verification: google14337db78de6911c.html");
    }

    if (incomingUrl.pathname === "/robots.txt") {
      const body = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml`;

      res.setHeader("content-type", "text/plain; charset=utf-8");
      return res.status(200).send(body);
    }

    if (incomingUrl.pathname === "/sitemap.xml") {
      const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
  </url>
</urlset>`;

      res.setHeader("content-type", "application/xml; charset=utf-8");
      return res.status(200).send(body);
    }

    if (incomingUrl.pathname.startsWith("/api/apps/")) {
      return res.status(200).send("Not proxied");
    }

    const upstreamUrl = new URL(req.url, `https://${req.headers.host}`);
    upstreamUrl.hostname = "regruha-terminal-core.base44.app";
    upstreamUrl.searchParams.set("v", "2");

    const fetchHeaders = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (!["host", "content-length"].includes(key.toLowerCase()) && value) {
        fetchHeaders.set(key, Array.isArray(value) ? value.join(",") : value);
      }
    }

    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: req.method,
      headers: fetchHeaders,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : req,
      redirect: "follow",
    });

    const contentType = upstreamResponse.headers.get("content-type") || "";
    let body;

    if (contentType.includes("text/html")) {
      body = await upstreamResponse.text();

      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Regruha",
        alternateName: "T-Regruha",
        url: `${siteUrl}/`,
        description,
      };

      body = body
        .replace(/<link[^>]+rel=["'](icon|shortcut icon|apple-touch-icon|canonical)["'][^>]*>\s*/gi, "")
        .replace(/<meta[^>]+name=["']description["'][^>]*>\s*/gi, "")
        .replace(/<title>[\s\S]*?<\/title>/gi, "")
        .replace(
          /<\/head>/i,
          `
<style>
  #base44-badge,
  #base44-edit-badge {
    display: none !important;
  }
</style>
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
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>`
        );

      res.setHeader("content-type", "text/html; charset=utf-8");
      res.setHeader("content-security-policy", "frame-ancestors *;");
      res.removeHeader("x-frame-options");
      res.removeHeader("x-robots-tag");
      return res.status(upstreamResponse.status).send(body);
    }

    const arrayBuffer = await upstreamResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    for (const [key, value] of upstreamResponse.headers.entries()) {
      if (
        !["content-length", "x-frame-options", "content-security-policy", "x-robots-tag"].includes(
          key.toLowerCase()
        )
      ) {
        res.setHeader(key, value);
      }
    }

    res.setHeader("content-security-policy", "frame-ancestors *;");
    return res.status(upstreamResponse.status).send(buffer);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
}

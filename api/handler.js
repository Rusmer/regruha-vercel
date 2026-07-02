export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const siteUrl = `${url.protocol}//${url.host}`;

  if (url.pathname === "/google14337db78de6911c.html") {
    res.status(200).send("google-site-verification: google14337db78de6911c.html");
    return;
  }

  if (url.pathname === "/robots.txt") {
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.status(200).send(`User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml`);
    return;
  }

  if (url.pathname === "/sitemap.xml") {
    res.setHeader("content-type", "application/xml; charset=utf-8");
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
  </url>
</urlset>`);
    return;
  }

  const upstreamUrl = new URL(req.url, `https://${req.headers.host}`);
  upstreamUrl.hostname = "regruha-terminal-core.base44.app";
  upstreamUrl.searchParams.set("v", "2");

  const upstreamResponse = await fetch(upstreamUrl.toString(), {
    method: req.method,
    headers: req.headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : req,
    redirect: "follow",
  });

  const text = await upstreamResponse.text();

  res.status(upstreamResponse.status);
  res.setHeader("content-type", upstreamResponse.headers.get("content-type") || "text/html; charset=utf-8");
  res.setHeader("content-security-policy", "frame-ancestors *;");
  res.setHeader("x-frame-options", "ALLOWALL");
  res.send(text);
}

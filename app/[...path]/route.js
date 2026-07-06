// app/[[...path]]/route.js
export const runtime = "edge";

const UPSTREAM = "regruha-terminal-core.base44.app";
const image = "https://github.com/Rusmer/regruha/blob/main/functions/favicon.png?raw=true";
const title = "Regruha — T-Regruha";
const description = "Regruha / T-Regruha — официальный сайт проекта.";

function siteUrl(request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function buildHeaders(siteUrlValue) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Regruha",
    alternateName: "T-Regruha",
    url: `${siteUrlValue}/`,
    description,
  };

  return `
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
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="googlebot" content="index, follow">
    <link rel="canonical" href="${siteUrlValue}/">
    <link rel="icon" type="image/png" href="${image}" sizes="32x32">
    <link rel="shortcut icon" href="${image}">
    <link rel="apple-touch-icon" href="${image}">
    <meta property="og:site_name" content="Regruha">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${siteUrlValue}/">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  `;
}

async function proxy(request, { addV2 = false } = {}) {
  const url = new URL(request.url);
  url.hostname = UPSTREAM;
  if (addV2) url.searchParams.set("v", "2");

  const res = await fetch(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.method === "GET" || request.method === "HEAD" ? null : await request.clone().text(),
    redirect: addV2 ? "follow" : "manual",
  });

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return res;

  let html = await res.text();
  html = html.replace(/<link[^>]+rel=["'](?:icon|shortcut icon|apple-touch-icon|canonical)["'][^>]*>\s*/gi, "");
  html = html.replace(/<meta[^>]+name=["']description["'][^>]*>\s*/gi, "");
  html = html.replace(/<title>.*?<\/title>/is, "");
  html = html.replace(/<textarea([^>]*)placeholder=["'][^"']*Напишите ответ\.\.\.[^"']*["']([^>]*)>/gi, '<textarea$1 placeholder="Напишите ответ..."$2>');
  html = html.replace(/<span[^>]*class=["'][^"']*font-mono[^"']*text-\[10px\][^"']*tracking-widest[^"']*text-gold[^"']*["'][^>]*>[\s\S]*?<\/span>/gi, (m) =>
    m.includes("// ОТВЕТИТЬ (поддерживается Markdown)") ? m.replace("// ОТВЕТИТЬ (поддерживается Markdown)", "// ОТВЕТИТЬ)") : m
  );

  html = html.replace(
    /<head([^>]*)>/i,
    `<head$1>${buildHeaders(siteUrl(request))}`
  );

  const headers = new Headers(res.headers);
  headers.delete("x-robots-tag");
  headers.delete("x-frame-options");
  headers.delete("content-security-policy");
  headers.set("content-security-policy", "frame-ancestors *;");

  return new Response(html, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

export async function GET(request) {
  const url = new URL(request.url);
  const base = siteUrl(request);

  if (url.pathname === "/google14337db78de6911c.html") {
    return new Response("google-site-verification: google14337db78de6911c.html", {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  if (url.pathname === "/robots.txt") {
    return new Response(`User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml`, {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  if (url.pathname === "/sitemap.xml") {
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${base}/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
  </url>
</urlset>`, {
      headers: { "content-type": "application/xml; charset=utf-8" },
    });
  }

  if (url.pathname.startsWith("/api/")) {
    return fetch(request);
  }

  return proxy(request, { addV2: true });
}

export async function POST(request) { return proxy(request, { addV2: !new URL(request.url).pathname.startsWith("/api/") }); }
export async function PUT(request) { return proxy(request, { addV2: !new URL(request.url).pathname.startsWith("/api/") }); }
export async function PATCH(request) { return proxy(request, { addV2: !new URL(request.url).pathname.startsWith("/api/") }); }
export async function DELETE(request) { return proxy(request, { addV2: !new URL(request.url).pathname.startsWith("/api/") }); }

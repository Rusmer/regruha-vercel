import { NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!api).*)"],
};

export default async function middleware(request) {
  const incomingUrl = new URL(request.url);
  const siteUrl = `${incomingUrl.protocol}//${incomingUrl.host}`;

  const image = "https://raw.githubusercontent.com/Rusmer/regruha/main/functions/favicon.png";
  const title = "Regruha — T-Regruha";
  const description = "Regruha / T-Regruha — официальный сайт проекта.";

  const url = new URL(request.url);
  url.hostname = "regruha-terminal-core.base44.app";
  url.searchParams.set("v", "2");

  const response = await fetch(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.clone().text(),
    redirect: "follow",
  });

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("text/html")) {
    return response;
  }

  let body = await response.text();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Regruha",
    alternateName: "T-Regruha",
    url: `${siteUrl}/`,
    description,
  };

  body = body
    .replace(/<link[^>]+rel=["']icon["'][^>]*>/gi, "")
    .replace(/<link[^>]+rel=["']shortcut icon["'][^>]*>/gi, "")
    .replace(/<link[^>]+rel=["']apple-touch-icon["'][^>]*>/gi, "")
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, "")
    .replace(/<meta[^>]+name=["']description["'][^>]*>/gi, "")
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, "")
    .replace(/<head([^>]*)>/i, `<head$1>
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
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`);

  body = body.replace(
    /<textarea([^>]*placeholder="[^"]*Напишите ответ\.\.\.[^"]*"[^>]*)>/gi,
    '<textarea$1 placeholder="Напишите ответ...">'
  );

  body = body.replace(
    /<span[^>]*class="[^"]*font-mono[^"]*text-\[10px\][^"]*tracking-widest[^"]*text-gold[^"]*"[^>]*>[\s\S]*?\/\/ ОТВЕТИТЬ \(поддерживается Markdown\)[\s\S]*?<\/span>/gi,
    '<span class="font-mono text-[10px] tracking-widest text-gold">// ОТВЕТИТЬ)</span>'
  );

  body = body.replace(
    /<\/head>/i,
    `
<style>
  #base44-badge,
  #base44-edit-badge {
    display: none !important;
  }
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
</head>`
  );

  const headers = new Headers(response.headers);
  headers.delete("x-robots-tag");
  headers.delete("x-frame-options");
  headers.delete("content-security-policy");
  headers.set("content-security-policy", "frame-ancestors *;");

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

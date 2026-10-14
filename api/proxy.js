// Единая точка входа для всех запросов зеркала Regruha.
//
// Cloudflare Pages раскладывал запросы по нескольким файлам:
//   functions/[[path]].js              — всё остальное + SEO-правки HTML
//   functions/api/[[path]].js          — прокси /api/* на Base44
//   functions/api/apps/auth/login.js   — отдельный OAuth-редирект
//   functions/ws-user-apps/[[path]].js — прокси терминала Base44
//
// Здесь это один Vercel Function, который сам маршрутизирует по pathname.
// Vercel подставляет исходный путь через transform `request.path` (см. vercel.json).

import { rewriteHtml } from "../lib/rewrite.js";
import { IMAGE } from "../lib/head.js";

// Node.js runtime (Vercel рекомендует его вместо edge; HTMLRewriter в edge недоступен).
export const config = { runtime: "nodejs" };

// Адреса источников. Переопределяются переменными окружения — удобно для тестов
// и на случай, если Base44-проект переедет.
const MAIN_ORIGIN = process.env.UPSTREAM_MAIN || "https://regruha.base44.app";
const API_ORIGIN = process.env.UPSTREAM_API || "https://regruha.base44.app";
const TERMINAL_ORIGIN =
  process.env.UPSTREAM_TERMINAL || "https://regruha-terminal-core.base44.app";

// Внутренний маршрут, на который vercel.json направляет все запросы.
const INTERNAL_ROUTE = "/api/proxy";

// Заголовок, которым vercel.json дублирует оригинальный путь (страховка на случай,
// если transform `request.path` не сработает).
const ORIGINAL_PATH_HEADER = "x-regruha-original-path";

// Заголовки запроса, которые нельзя прокидывать на источник.
const SKIP_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "upgrade",
  "expect",
  ORIGINAL_PATH_HEADER,
]);

// Заголовки ответа, которые ломают ответ после распаковки/перезаписи тела:
// Node fetch уже распаковал gzip/br, но заголовки остаются от источника.
const SKIP_RESPONSE_HEADERS = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
  "keep-alive",
]);

/** Копирует заголовки запроса, отбрасывая hop-by-hop и запрещённые. */
function upstreamRequestHeaders(request) {
  const headers = new Headers();
  for (const [key, value] of request.headers) {
    if (SKIP_REQUEST_HEADERS.has(key.toLowerCase())) continue;
    headers.set(key, value);
  }
  return headers;
}

/** Копирует заголовки ответа, отбрасывая те, что не соответствуют телу. */
function upstreamResponseHeaders(response) {
  const headers = new Headers(response.headers);
  for (const key of SKIP_RESPONSE_HEADERS) headers.delete(key);
  return headers;
}

/**
 * Определяет публичный адрес зеркала. Vercel проксирует запрос, поэтому реальный
 * домен (custom domain) удобнее брать из x-forwarded-*, а не из url.host.
 * @returns {string} например https://regruha.example.com
 */
function requestOrigin(request, url) {
  const first = (value) => (value || "").split(",")[0].trim();
  const host = first(request.headers.get("x-forwarded-host")) || url.host;
  const proto =
    first(request.headers.get("x-forwarded-proto")) ||
    url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

/** Читает тело запроса (Vercel fetch не умеет стримить тело запроса без duplex). */
async function readRequestBody(request) {
  if (request.method === "GET" || request.method === "HEAD") return undefined;
  const buffer = await request.arrayBuffer();
  return buffer.byteLength > 0 ? buffer : undefined;
}

/** Возвращает проксированный ответ без изменений тела. */
function passthrough(response) {
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: upstreamResponseHeaders(response),
  });
}

/** Проксирует /api/* на Base44, сохраняя редиректы для клиента. */
async function proxyApi(request, url) {
  const target = new URL(url.pathname + url.search, API_ORIGIN);

  // Base44 не должен получать адрес зеркала как from_url при OAuth-логине.
  if (
    target.pathname === "/api/apps/auth/login" &&
    target.searchParams.has("from_url")
  ) {
    target.searchParams.set(
      "from_url",
      "https://regruha-terminal-core.base44.app/"
    );
  }

  const response = await fetch(target, {
    method: request.method,
    headers: upstreamRequestHeaders(request),
    body: await readRequestBody(request),
    redirect: "manual",
  });

  return passthrough(response);
}

/**
 * Проксирует /ws-user-apps/* на терминал Base44 и прячет бейдж Base44.
 * Стиль вставляется в <head>, как это делал HTMLRewriter.
 */
async function proxyWsUserApps(request, url) {
  const target = new URL(url.pathname + url.search, TERMINAL_ORIGIN);

  const response = await fetch(target, {
    method: request.method,
    headers: upstreamRequestHeaders(request),
    body: await readRequestBody(request),
    redirect: "manual",
  });

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return passthrough(response);
  }

  let html = await response.text();
  html = html.replace(
    /<head([^>]*)>/i,
    (match) =>
      `${match}<style>#base44-badge,#base44-edit-badge{display:none !important;}</style>`
  );

  const headers = upstreamResponseHeaders(response);
  headers.set(
    "content-type",
    contentType.includes("charset") ? contentType : `${contentType}; charset=utf-8`
  );

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** Проксирует основную страницу и перезаписывает HTML. */
async function proxyMain(request, url, siteUrl) {
  const target = new URL(url.pathname + url.search, MAIN_ORIGIN);
  target.searchParams.set("v", "2");

  const response = await fetch(target, {
    method: request.method,
    headers: upstreamRequestHeaders(request),
    body: await readRequestBody(request),
    redirect: "follow",
  });

  const headers = upstreamResponseHeaders(response);
  headers.delete("x-robots-tag");
  headers.delete("x-frame-options");
  headers.delete("content-security-policy");
  headers.set("content-security-policy", "frame-ancestors *;");

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  const html = await response.text();
  const rewritten = rewriteHtml(html, siteUrl);

  return new Response(rewritten, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** Отдельный OAuth-редирект (бывший functions/api/apps/auth/login.js). */
function handleAuthLogin(url, siteUrl) {
  const appId = url.searchParams.get("app_id");
  if (!appId) {
    return new Response("Missing app_id", { status: 400 });
  }

  const target = new URL("https://app.base44.com/api/apps/auth/login");
  target.searchParams.set("app_id", appId);
  // После успешного входа Base44 вернёт пользователя на наше зеркало.
  target.searchParams.set("from_url", process.env.SITE_URL || `${siteUrl}/`);

  return Response.redirect(target.toString(), 302);
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // vercel.json подставляет исходный путь трансформом `request.path`, и он уже
    // лежит в url.pathname. Если трансформ почему-то не сработал (запрос пришёл на
    // внутренний маршрут) — используем путь из дублирующего заголовка.
    if (url.pathname === INTERNAL_ROUTE) {
      const override = request.headers.get(ORIGINAL_PATH_HEADER);
      if (override) url.pathname = override;
    }

    const pathname = url.pathname;
    const siteUrl = requestOrigin(request, url);

    if (pathname === "/google14337db78de6911c.html") {
      return new Response(
        "google-site-verification: google14337db78de6911c.html",
        { headers: { "content-type": "text/html; charset=utf-8" } }
      );
    }

    if (pathname === "/robots.txt") {
      const body = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml`;

      return new Response(body, {
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    if (pathname === "/sitemap.xml") {
      const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
  </url>
</urlset>`;

      return new Response(body, {
        headers: { "content-type": "application/xml; charset=utf-8" },
      });
    }

    if (pathname === "/favicon.png" || pathname === "/favicon.ico") {
      return Response.redirect(IMAGE, 302);
    }

    if (pathname === "/api/apps/auth/login") {
      return handleAuthLogin(url, siteUrl);
    }

    if (pathname.startsWith("/api/")) {
      return proxyApi(request, url);
    }

    if (pathname.startsWith("/ws-user-apps/")) {
      return proxyWsUserApps(request, url);
    }

    return proxyMain(request, url, siteUrl);
  },
};

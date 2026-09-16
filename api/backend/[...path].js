const UPSTREAM = "https://regruha.base44.app";

export default async function handler(request) {
  const incoming = new URL(request.url);
  const path = incoming.pathname.replace(/^\/api\/backend(?=\/|$)/, "") || "/";
  const upstream = new URL(UPSTREAM);
  upstream.pathname = path.startsWith("/") ? path : `/${path}`;
  upstream.search = "";

  for (const [key, value] of incoming.searchParams) {
    upstream.searchParams.append(key, value);
  }

  // Preserve the original behavior: Base44 must not receive a pages.dev
  // from_url during OAuth login.
  if (upstream.pathname === "/api/apps/auth/login" && upstream.searchParams.has("from_url")) {
    upstream.searchParams.set("from_url", "https://regruha-terminal-core.base44.app/");
  }

  const init = {
    method: request.method,
    headers: request.headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  return fetch(upstream, init);
}

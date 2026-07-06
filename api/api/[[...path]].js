export const config = {
  runtime: "edge",
};

export default async function handler(request) {
  const incoming = new URL(request.url);

  const url = new URL(request.url);
  url.hostname = "regruha-terminal-core.base44.app";
  url.protocol = "https:";
  url.pathname = incoming.pathname.replace(/^\/api/, "");
  url.search = incoming.search;

  const res = await fetch(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.clone().text(),
    redirect: "manual",
  });

  const headers = new Headers(res.headers);

  return new Response(await res.text(), {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

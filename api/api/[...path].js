export const config = {
  runtime: "edge",
};

export default async function handler(request) {
  const incoming = new URL(request.url);

  const target = new URL(request.url);
  target.protocol = "https:";
  target.hostname = "regruha-terminal-core.base44.app";
  target.pathname = incoming.pathname.replace(/^\/api/, "") || "/";
  target.search = incoming.search;

  const res = await fetch(target.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.clone().text(),
    redirect: "manual",
  });

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
}

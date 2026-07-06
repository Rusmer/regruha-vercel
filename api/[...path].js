export const config = {
  runtime: "edge",
};

export default async function handler(request) {
  const incomingUrl = new URL(request.url);

  const url = new URL(request.url);
  url.protocol = "https:";
  url.hostname = "regruha-terminal-core.base44.app";

  const res = await fetch(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.clone().text(),
    redirect: "manual",
  });

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
}

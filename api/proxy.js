const UPSTREAM = "regruha-terminal-core.base44.app";

export default async function handler(req, res) {
  const url = new URL(req.url);
  url.hostname = UPSTREAM;

  const response = await fetch(url.toString(), {
    method: req.method,
    headers: req.headers,
    body: req.method === "GET" || req.method === "HEAD" ? null : req,
    redirect: "manual",
  });

  res.status(response.status);
  response.headers.forEach((v, k) => res.setHeader(k, v));
  return res.send(await response.text());
}

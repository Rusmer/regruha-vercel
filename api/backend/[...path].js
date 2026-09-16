export default async function handler(req, res) {
  const incoming = new URL(req.url, `https://${req.headers.host || "localhost"}`);
  const path = incoming.pathname.replace(/^\/api\/backend/, "");
  const target = new URL(`https://regruha.base44.app${path || "/"}`);
  target.search = incoming.search;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value != null && !["host", "content-length"].includes(key.toLowerCase())) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
  }

  const body = ["GET", "HEAD"].includes(req.method) ? undefined : await readBody(req);
  const response = await fetch(target, {
    method: req.method,
    headers,
    body,
    redirect: "manual",
  });

  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    if (!["content-length", "content-encoding"].includes(key.toLowerCase())) res.setHeader(key, value);
  });
  return res.end(Buffer.from(await response.arrayBuffer()));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

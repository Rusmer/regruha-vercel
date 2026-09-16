export default function handler(req, res) {
  const incoming = new URL(req.url, `https://${req.headers.host || "localhost"}`);
  const appId = incoming.searchParams.get("app_id");
  if (!appId) return res.status(400).send("Missing app_id");

  const target = new URL("https://app.base44.com/api/apps/auth/login");
  target.searchParams.set("app_id", appId);
  target.searchParams.set("from_url", `https://${req.headers.host}/`);
  return res.redirect(302, target.toString());
}

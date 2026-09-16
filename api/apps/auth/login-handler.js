export default async function handler(request) {
  const incoming = new URL(request.url);
  const appId = incoming.searchParams.get("app_id");

  if (!appId) {
    return new Response("Missing app_id", { status: 400 });
  }

  const target = new URL("https://app.base44.com/api/apps/auth/login");
  target.searchParams.set("app_id", appId);
  target.searchParams.set("from_url", `${incoming.origin}/`);

  return Response.redirect(target.toString(), 302);
}

export async function onRequest(context) {
  const incoming = new URL(context.request.url);

  const appId = incoming.searchParams.get("app_id");

  if (!appId) {
    return new Response("Missing app_id", {
      status: 400,
    });
  }

  const target = new URL(
    "https://app.base44.com/api/apps/auth/login"
  );

  target.searchParams.set("app_id", appId);

  // После успешного входа Base44 должен вернуть
  // пользователя на наше зеркало.
  target.searchParams.set(
    "from_url",
    "https://regruha.pages.dev/"
  );

  return Response.redirect(
    target.toString(),
    302
  );
}

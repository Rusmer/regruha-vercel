export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);

  // Основной сервер Base44
  url.hostname = "regruha.base44.app";

  // Исправляем OAuth login:
  // Base44 не должен получать pages.dev как from_url
  if (
    url.pathname === "/api/apps/auth/login" &&
    url.searchParams.has("from_url")
  ) {
    url.searchParams.set(
      "from_url",
      "https://regruha-terminal-core.base44.app/"
    );
  }

  return fetch(url, {
    method: request.method,
    headers: request.headers,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : request.body,
    redirect: "manual",
  });
}

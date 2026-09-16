export const config = {
  matcher: "/:path*",
};

export default async function middleware(request) {
  const url = new URL(request.url);

  url.hostname = "regruha.pages.dev";

  return fetch(url.toString(), {
    method: request.method,
    headers: request.headers,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? null
        : request.body,
    redirect: "follow",
  });
}

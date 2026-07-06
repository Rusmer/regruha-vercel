export const config = {
  runtime: "edge",
};

export default async function handler(request) {
  const url = new URL(request.url);
  url.hostname = "regruha-terminal-core.base44.app";

  const res = await fetch(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.clone().text(),
    redirect: "manual",
  });

  const contentType = res.headers.get("content-type") || "";
  let body = await res.text();

  if (contentType.includes("text/html")) {
    body = body.replace(
      /<\/head>/i,
      `<style>
        #base44-badge,
        #base44-edit-badge {
          display: none !important;
        }
      </style></head>`
    );
  }

  const headers = new Headers(res.headers);

  return new Response(body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

export const runtime = "edge";

const UPSTREAM = "regruha-terminal-core.base44.app";

export async function GET(request) {
  return forward(request);
}

export async function POST(request) {
  return forward(request);
}

export async function PUT(request) {
  return forward(request);
}

export async function PATCH(request) {
  return forward(request);
}

export async function DELETE(request) {
  return forward(request);
}

export async function HEAD(request) {
  return forward(request);
}

export async function OPTIONS(request) {
  return forward(request);
}

async function forward(request) {
  const url = new URL(request.url);
  url.hostname = UPSTREAM;

  const res = await fetch(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.method === "GET" || request.method === "HEAD" ? null : await request.clone().text(),
    redirect: "manual",
  });

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
}

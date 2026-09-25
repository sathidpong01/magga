// A removed page must return a real 404 instead of falling through to the
// dynamic manga route, which can stream a not-found page with HTTP 200.
export function GET() {
  return new Response("Not Found", { status: 404 });
}

export function HEAD() {
  return new Response(null, { status: 404 });
}

import { authenticateRequest } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request, { role: "admin" });
  if (!auth.ok) return auth.response;
  return Response.json({ now: new Date().toISOString() }, { headers: { "Cache-Control": "private, no-store" } });
}

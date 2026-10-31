import { NextResponse } from "next/server";
import { CONSENT_COOKIE, CONSENT_VERSION, CONSENT_MAX_AGE } from "@/lib/privacy-consent";
import { VISITOR_COOKIE_NAME } from "@/lib/visitor-id";

export async function POST(request: Request) {
  const url = new URL(request.url);
  // Next may normalize the URL host; use the browser authority, never X-Forwarded-Host.
  const expectedOrigin = request.headers.get("host") ? `${url.protocol}//${request.headers.get("host")}` : url.origin;
  if (request.headers.get("origin") !== expectedOrigin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (typeof body?.statistics !== "boolean") return NextResponse.json({ error: "Invalid choice" }, { status: 400 });
  const response = NextResponse.json({ saved: true }, { headers: { "Cache-Control": "private, no-store" } });
  const options = { path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" };
  response.cookies.set(CONSENT_COOKIE, `${CONSENT_VERSION}.${body.statistics ? "yes" : "no"}.${Date.now()}`, { ...options, maxAge: CONSENT_MAX_AGE });
  response.cookies.set(VISITOR_COOKIE_NAME, "", { ...options, httpOnly: true, maxAge: 0 });
  return response;
}

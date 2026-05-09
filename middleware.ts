import { NextRequest, NextResponse } from "next/server";

// Protect /dashboard/admin/* at the edge — redirect unauthenticated/non-admin
// users before the server component even runs. Session validation is done by
// the page itself; this middleware only checks the cookie presence so it stays
// fast and avoids a DB round-trip on the edge.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard/admin")) {
    const sessionCookie =
      request.cookies.get("better-auth.session_token") ??
      request.cookies.get("__Secure-better-auth.session_token");

    if (!sessionCookie) {
      const signIn = new URL("/auth/signin", request.url);
      signIn.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signIn);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/admin/:path*"],
};

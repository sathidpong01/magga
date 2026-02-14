import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Strict role check for admin routes
  if (nextUrl.pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }
    if (req.auth?.user?.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.rewrite(
        new URL("/auth/signin?message=You are not authorized!", req.url)
      );
    }
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};

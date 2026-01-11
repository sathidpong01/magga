import { Session } from "next-auth";
import { NextResponse } from "next/server";

/**
 * Require admin role for the session
 * @returns NextResponse with error if not admin, null if authorized
 */
export function requireAdmin(session: Session | null): NextResponse | null {
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user?.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden - Admin access required" },
      { status: 403 }
    );
  }

  return null; // Authorized
}

/**
 * Require any authenticated session
 * @returns NextResponse with error if not authenticated, null if authorized
 */
export function requireAuth(session: Session | null): NextResponse | null {
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null; // Authorized
}

/**
 * Check if user owns the resource
 * @returns true if user owns resource or is admin
 */
export function canModifyResource(
  session: Session | null,
  resourceUserId: string
): boolean {
  if (!session) return false;
  if (session.user?.role === "ADMIN") return true;
  return session.user?.id === resourceUserId;
}

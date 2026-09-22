import { NextResponse } from "next/server";
import type { Session } from "@/lib/auth";

export type SessionLike = {
  user?: {
    id?: string;
    role?: string | null;
    banned?: boolean | null;
    isBanned?: boolean | null;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  } | null;
} | null;

export interface CallerUser {
  id: string;
  email: string;
  role: string;
  name: string | null;
  image: string | null;
}

export interface CallerContext {
  user: CallerUser;
  session: unknown;
  canModify(resourceUserId: string): boolean;
}

export interface AuthOptions {
  role?: string;
  allowBanned?: boolean;
}

export type AuthResult =
  | { ok: true; caller: CallerContext }
  | {
      ok: false;
      error: string;
      status: 401 | 403;
      code: "UNAUTHORIZED" | "BANNED" | "FORBIDDEN";
    };

export type AuthRequestResult =
  | { ok: true; caller: CallerContext }
  | { ok: false; response: NextResponse };

export const BANNED_ERROR = "บัญชีของคุณถูกระงับการใช้งาน";

export function getSessionRole(session: SessionLike): string {
  const role = session?.user?.role;
  return typeof role === "string" ? role.toLowerCase() : "";
}

export function isAdminRole(session: SessionLike): boolean {
  return getSessionRole(session) === "admin";
}

export function isUserBanned(session: SessionLike): boolean {
  const user = session?.user;
  return Boolean(user && (user.banned ?? user.isBanned));
}

export function canModifyResource(
  session: SessionLike | CallerContext,
  resourceUserId: string
): boolean {
  if (!session) return false;
  if ("canModify" in session && typeof session.canModify === "function") {
    return session.canModify(resourceUserId);
  }
  if (isAdminRole(session as SessionLike)) return true;
  return (session as SessionLike)?.user?.id === resourceUserId;
}

export function isValidCallbackUrl(url: string | null): string {
  if (!url) return "/";
  try {
    if (url.startsWith("/") && !url.startsWith("//")) return url;
    return "/";
  } catch {
    return "/";
  }
}

/**
 * Authenticate incoming request for Next.js Route Handlers
 */
export async function authenticateRequest(
  request: Request,
  options?: AuthOptions
): Promise<AuthRequestResult> {
  const result = await authenticateCaller(request.headers, options);
  if (!result.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: result.error },
        { status: result.status }
      ),
    };
  }

  return { ok: true, caller: result.caller };
}

/**
 * Authenticate caller for Server Actions and Server Components
 */
export async function authenticateCaller(
  headersInput?: Headers | HeadersInit | null,
  options?: AuthOptions
): Promise<AuthResult> {
  let resolvedHeaders: HeadersInit = {};
  if (headersInput) {
    resolvedHeaders = headersInput;
  } else {
    try {
      const { headers } = await import("next/headers");
      resolvedHeaders = await headers();
    } catch {
      // outside request context
    }
  }

  const { auth } = await import("@/lib/auth");
  const session = await auth.api.getSession({ headers: resolvedHeaders });

  if (!session?.user?.id) {
    return {
      ok: false,
      error: "Unauthorized",
      status: 401,
      code: "UNAUTHORIZED",
    };
  }

  if (!options?.allowBanned && isUserBanned(session)) {
    return {
      ok: false,
      error: BANNED_ERROR,
      status: 403,
      code: "BANNED",
    };
  }

  const role = getSessionRole(session);
  if (options?.role && role !== options.role.toLowerCase()) {
    return {
      ok: false,
      error: "Forbidden - Admin access required",
      status: 403,
      code: "FORBIDDEN",
    };
  }

  const callerUser: CallerUser = {
    id: session.user.id,
    email: session.user.email || "",
    role,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
  };

  const caller: CallerContext = {
    user: callerUser,
    session,
    canModify(resourceUserId: string): boolean {
      return role === "admin" || callerUser.id === resourceUserId;
    },
  };

  return { ok: true, caller };
}

/**
 * Backwards-compatible requireAdmin helper
 */
export function requireAdmin(session: SessionLike): NextResponse | null {
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isUserBanned(session)) {
    return NextResponse.json({ error: BANNED_ERROR }, { status: 403 });
  }

  if (!isAdminRole(session)) {
    return NextResponse.json(
      { error: "Forbidden - Admin access required" },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Backwards-compatible requireAuth helper
 */
export function requireAuth(session: SessionLike): NextResponse | null {
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isUserBanned(session)) {
    return NextResponse.json({ error: BANNED_ERROR }, { status: 403 });
  }

  return null;
}

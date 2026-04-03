import { randomUUID } from "crypto";

export const VISITOR_COOKIE_NAME = "magga_vid";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function createVisitorId(): string {
  return randomUUID().replace(/-/g, "");
}

export function getVisitorCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VISITOR_COOKIE_MAX_AGE,
  };
}

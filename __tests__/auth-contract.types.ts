import type { Session } from "@/lib/auth";

// Typecheck must retain plugin/custom fields after a clean dependency install.
// Losing these fields broke Vercel builds and could hide authorization mistakes.
type Assert<T extends true> = T;
export type AuthSessionContract = Assert<
  "role" | "banned" | "isBanned" | "username" extends keyof Session["user"]
    ? true
    : false
>;

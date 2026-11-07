import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-helpers";
import { readCommentJson } from "@/lib/comments/request";
import { assertPollOrigin } from "./security";
import { PollError } from "./types";

export const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie",
};
export const pollJson = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: privateHeaders });
export async function pollAdmin(request: Request, mutation = false) {
  if (mutation) assertPollOrigin(request);
  const result = await authenticateRequest(request, {
    role: "admin",
    fresh: true,
  });
  if (!result.ok)
    throw new PollError("คุณไม่มีสิทธิ์จัดการโพล", result.response.status);
  return result.caller;
}
export const readPollJson = (request: Request) =>
  readCommentJson(request, 48 * 1024);
export function pollFailure(error: unknown) {
  if (error instanceof PollError)
    return NextResponse.json(
      { error: error.message, code: error.code },
      {
        status: error.status,
        headers: {
          ...privateHeaders,
          ...(error.retryAfter
            ? { "Retry-After": String(error.retryAfter) }
            : {}),
        },
      },
    );
  if (
    error instanceof Error &&
    "status" in error &&
    typeof error.status === "number" &&
    error.status >= 400 &&
    error.status < 500
  )
    return pollJson({ error: error.message }, error.status);
  console.error("Poll request failed:", error);
  return pollJson({ error: "ระบบโหวตยังไม่พร้อม กรุณาลองใหม่ภายหลัง" }, 503);
}

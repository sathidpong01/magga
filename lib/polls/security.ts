import { createHash, createHmac, randomBytes } from "node:crypto";
import { authenticateCaller } from "@/lib/auth-helpers";
import { assertCommentOrigin } from "@/lib/comments/identity";
import { pollDatabase } from "./database";
import type { PollExecutor } from "./database";
import type { Voter } from "./service";
import { PollError } from "./types";

export const POLL_COOKIE_SECONDS = 180 * 24 * 60 * 60;
export const pollCookieName = () =>
  process.env.NODE_ENV === "production" ? "__Host-magga-poll" : "magga-poll";
export const hashPollToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export function assertPollOrigin(request: Request) {
  assertCommentOrigin(request.headers);
}
export function abuseSecret() {
  const secret =
    process.env.POLL_ABUSE_SECRET || process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new PollError("ระบบยืนยันการโหวตยังไม่พร้อม", 503);
  return secret;
}
export function trustedNetwork(headers: Headers) {
  const value = process.env.VERCEL
    ? headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    : null;
  if (process.env.VERCEL && !value)
    throw new PollError("ไม่สามารถตรวจเครือข่ายได้ กรุณาลองใหม่", 503);
  return (
    value ||
    (process.env.NODE_ENV !== "production" ||
    process.env.MAGGA_DISPOSABLE_DATABASE === "true"
      ? "local"
      : null)
  );
}
export async function resolveVoter(headers: Headers): Promise<Voter> {
  const session = await authenticateCaller(headers, { fresh: true });
  if (!session.ok && session.code !== "UNAUTHORIZED")
    throw new PollError("บัญชีนี้ไม่มีสิทธิ์โหวต", 403);
  const token = headers
    .get("cookie")
    ?.split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(`${pollCookieName()}=`))
    ?.slice(pollCookieName().length + 1);
  let guestHash: string | null = null;
  if (token && /^[A-Za-z0-9_-]{43}$/.test(token)) {
    const hash = hashPollToken(token);
    const rows = await pollDatabase.query(
      "SELECT token_hash FROM private.poll_sessions WHERE token_hash=$1 AND expires_at>clock_timestamp()",
      [hash],
    );
    if (rows.length) guestHash = hash;
  }
  return {
    guestHash,
    userId: session.ok ? session.caller.user.id : null,
    network: trustedNetwork(headers),
    secret: abuseSecret(),
  };
}
export async function issuePollSession() {
  const token = randomBytes(32).toString("base64url");
  await pollDatabase.query(
    "INSERT INTO private.poll_sessions(token_hash,expires_at) VALUES($1,clock_timestamp()+interval '180 days')",
    [hashPollToken(token)],
  );
  return token;
}
export async function consumePollLimit(
  database: PollExecutor,
  key: string,
  max: number,
  seconds: number,
) {
  const [row] = await database.query<{ count: number; wait: number }>(
    `INSERT INTO private.poll_limits(key,count,expires_at) VALUES($1,1,clock_timestamp()+$3 * interval '1 second')
    ON CONFLICT(key) DO UPDATE SET count=CASE WHEN private.poll_limits.expires_at<=clock_timestamp() THEN 1 ELSE LEAST(private.poll_limits.count+1,$2+1) END,
    expires_at=CASE WHEN private.poll_limits.expires_at<=clock_timestamp() THEN clock_timestamp()+$3 * interval '1 second' ELSE private.poll_limits.expires_at END
    RETURNING count,GREATEST(1,ceil(extract(epoch FROM expires_at-clock_timestamp())))::int AS wait`,
    [key, max, seconds],
  );
  if (!row || row.count > max)
    throw new PollError(
      "คุณส่งคำขอถี่เกินไป กรุณารอสักครู่",
      429,
      "RATE_LIMITED",
      row?.wait ?? seconds,
    );
}
export function networkKey(headers: Headers) {
  const ip = trustedNetwork(headers);
  if (!ip) throw new PollError("ไม่สามารถตรวจเครือข่ายได้", 503);
  return createHmac("sha256", abuseSecret())
    .update(`poll-rate:${ip}`)
    .digest("hex");
}
export function pollVerificationKey(
  id: string,
  voter: Voter,
  requestId: string,
  token?: string,
) {
  // Siteverify retries are scoped to this server-verified actor, poll, payload attempt and token.
  // Reusing a caller-supplied UUID across guest cookies must not replay another verification.
  const hex = createHmac("sha256", voter.secret)
    .update(
      JSON.stringify([id, voter.guestHash, voter.userId, requestId, token]),
    )
    .digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
export async function verifyPollChallenge(
  headers: Headers,
  token?: string,
  requestId?: string,
) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
    throw new PollError(
      "ระบบยืนยันผู้โหวตยังไม่พร้อม กรุณาลองใหม่ภายหลัง",
      503,
      "VERIFICATION_UNAVAILABLE",
    );
  if (!token || token.length > 2048)
    throw new PollError(
      "กรุณายืนยันว่าคุณไม่ใช่บอต",
      400,
      "VERIFICATION_REQUIRED",
    );
  let result: { success?: boolean; hostname?: string; action?: string };
  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        signal: AbortSignal.timeout(10000),
        body: new URLSearchParams({
          secret,
          response: token,
          ...(requestId ? { idempotency_key: requestId } : {}),
        }),
      },
    );
    if (!response.ok) throw new Error("Challenge provider unavailable");
    result = await response.json();
  } catch {
    throw new PollError(
      "ระบบยืนยันไม่พร้อม กรุณาลองใหม่",
      503,
      "VERIFICATION_UNAVAILABLE",
    );
  }
  const hostname = new URL(headers.get("origin") || "https://invalid.local")
    .hostname;
  if (
    result.success !== true ||
    result.hostname !== hostname ||
    result.action !== "poll_vote"
  )
    throw new PollError(
      "การยืนยันหมดอายุหรือไม่ถูกต้อง กรุณายืนยันอีกครั้ง",
      400,
      "VERIFICATION_REQUIRED",
    );
}

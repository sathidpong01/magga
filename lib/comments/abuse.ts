import { createHmac } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { commentRateLimits } from "@/db/schema";
import { RateLimitCommentError, ForbiddenCommentError } from "./types";
import type { CommentActor } from "./identity";
import { assertGuestCommentsEnabled } from "./config";

function hashNetwork(ip:string) {
  const secret=process.env.COMMENT_ABUSE_SECRET || process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new RateLimitCommentError("ระบบตรวจเครือข่ายไม่พร้อม กรุณาลองใหม่");
  return createHmac("sha256",secret).update(ip).digest("hex");
}

async function consume(key: string, max: number, windowMs: number, bytes = 0, maxBytes = Number.MAX_SAFE_INTEGER, database: Pick<typeof db,"insert"> = db) {
  const start = Math.floor(Date.now()/windowMs)*windowMs;
  const scopedKey = `${key}:${start}`;
  const [row] = await database.insert(commentRateLimits).values({key:scopedKey,windowStart:new Date(start),expiresAt:new Date(start+windowMs),count:1,bytes}).onConflictDoUpdate({target:commentRateLimits.key,set:{count:sql`${commentRateLimits.count}+1`,bytes:sql`${commentRateLimits.bytes}+${bytes}`},setWhere:sql`${commentRateLimits.count}<${max} AND ${commentRateLimits.bytes}+${bytes}<=${maxBytes}`}).returning();
  if (!row || row.bytes>maxBytes) throw new RateLimitCommentError("คุณใช้งานเร็วเกินไป กรุณารอสักครู่",start+windowMs,Math.ceil(windowMs/60000));
}
export async function consumeCommentLimit(actor: CommentActor, headers: Headers, kind: "comment"|"upload"|"vote"|"report"|"moderation", bytes = 0, database: Pick<typeof db,"insert"> = db) {
  if (kind === "moderation" && (actor.kind !== "member" || actor.role !== "admin")) throw new ForbiddenCommentError();
  if (kind === "comment" || kind === "upload") assertGuestCommentsEnabled(actor,kind === "upload");
  const ip = process.env.VERCEL ? headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() : null;
  if (process.env.VERCEL && !ip) throw new RateLimitCommentError("ไม่สามารถตรวจเครือข่ายได้ กรุณาลองใหม่");
  const key = actor.kind === "member" ? `member:${actor.userId}` : `guest:${actor.guestId}`;
  const max = kind === "moderation" ? 100 : kind === "comment" ? 20 : 10;
  await consume(`${kind}:${key}`,max,15*60*1000,bytes,kind === "upload" ? 30*1024*1024 : Number.MAX_SAFE_INTEGER,database);
  await consume(`${kind}:burst:${key}`,kind === "moderation" ? 20 : 4,30000,0,Number.MAX_SAFE_INTEGER,database);
  // Only the Vercel-controlled edge header is trusted; forwarded client headers are ignored.
  if (ip) await consume(`${kind}:network:${hashNetwork(ip)}`,200,15*60*1000,bytes,300*1024*1024,database);
}
export async function consumeGuestCreationLimit(headers: Headers) {
  const ip = process.env.VERCEL ? headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() : "local";
  if (!ip) throw new RateLimitCommentError("ไม่สามารถตรวจเครือข่ายได้ กรุณาลองใหม่");
  const hash=hashNetwork(ip);
  await consume(`guest:create:${hash}`,100,15*60*1000);
  await consume(`guest:create:burst:${hash}`,20,30000);
}

import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, commentGuests, commentGuestSessions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getSiteUrl } from "@/lib/site-url";
import { CommentError, ForbiddenCommentError, UnauthorizedCommentError, ValidationCommentError } from "./types";

export type CommentActor = { kind: "member"; userId: string; role: string; name: string; image: string | null } | { kind: "guest"; guestId: string; sessionId: string; name: string; publicCode: string; verifiedUntil: Date | null };
export const GUEST_SESSION_SECONDS = 180 * 24 * 60 * 60;
export const guestCookieName = () => process.env.NODE_ENV === "production" ? "__Host-magga-comment" : "magga-comment";
export const hashGuestToken = (token: string) => createHash("sha256").update(token).digest("hex");
export function assertCommentOrigin(headers: Headers) {
  const origin = headers.get("origin");
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || (process.env.NODE_ENV === "production" ? getSiteUrl() : null);
  const host = headers.get("host");
  const allowed = configured ? new URL(configured).origin : process.env.NODE_ENV !== "production" && host ? `http://${host}` : null;
  // Preview hosts are server-provided deployment configuration, never client-forwarded headers.
  const preview = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  if (!origin || (origin !== allowed && origin !== preview) || headers.get("sec-fetch-site") === "cross-site") throw new ForbiddenCommentError("แหล่งที่มาของคำขอไม่ถูกต้อง");
}
export const assertSameOrigin = (request: Request) => assertCommentOrigin(request.headers);
export async function resolveGuestActor(headers: Headers): Promise<Extract<CommentActor,{kind:"guest"}> | null> {
  const token = headers.get("cookie")?.split(";").map(v => v.trim()).find(v => v.startsWith(`${guestCookieName()}=`))?.slice(guestCookieName().length + 1);
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const [row] = await db.select({session:commentGuestSessions,guest:commentGuests}).from(commentGuestSessions).innerJoin(commentGuests,eq(commentGuestSessions.guestId,commentGuests.id)).where(eq(commentGuestSessions.tokenHash,hashGuestToken(token))).limit(1);
  if (!row) return null;
  if (row.guest.isBanned) throw new ForbiddenCommentError("ผู้เยี่ยมชมนี้ถูกระงับการแสดงความคิดเห็น");
  if (row.session.revokedAt || row.session.expiresAt.getTime()<=Date.now()) return null;
  return {kind:"guest",guestId:row.guest.id,sessionId:row.session.id,name:row.guest.name,publicCode:row.guest.publicCode,verifiedUntil:row.session.verifiedUntil};
}
export async function resolveCommentActor(headers: Headers): Promise<CommentActor | null> {
  // Errors deliberately propagate: a broken member session must never become a guest.
  const session = await auth.api.getSession({headers,query:{disableCookieCache:true}});
  if (session?.user.id) {
    const [user] = await db.select().from(profiles).where(eq(profiles.id,session.user.id)).limit(1);
    if (!user || user.isBanned || user.banned) throw new ForbiddenCommentError("บัญชีของคุณถูกระงับการใช้งาน");
    return {kind:"member",userId:user.id,role:user.role,name:user.name || user.username || "สมาชิก",image:user.image};
  }
  return resolveGuestActor(headers);
}
export const getCommentActor = resolveCommentActor;
export async function requireCommentActor(headers: Headers): Promise<CommentActor> {
  const actor = await resolveCommentActor(headers);
  if (!actor) throw new UnauthorizedCommentError("กรุณายืนยันผู้เยี่ยมชมก่อนแสดงความคิดเห็น");
  return actor;
}
export function publicCommentActor(actor: CommentActor | null) {
  if (!actor) return null;
  return {kind:actor.kind,name:actor.name,image:actor.kind === "member" ? actor.image : null,publicCode:actor.kind === "guest" ? actor.publicCode : undefined,canVote:actor.kind === "member",requiresVerification:actor.kind === "guest" && (!actor.verifiedUntil || actor.verifiedUntil.getTime()<=Date.now())};
}
export async function verifyCommentChallenge(headers: Headers, token?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) throw new CommentError("ระบบยืนยันผู้เยี่ยมชมยังไม่พร้อม",503,"VERIFICATION_UNAVAILABLE");
  if (!token || typeof token !== "string" || token.length > 2048) throw new ValidationCommentError("กรุณายืนยันว่าคุณไม่ใช่บอต");
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body:new URLSearchParams({secret,response:token}),signal:AbortSignal.timeout(10000)});
  if (!response.ok) throw new CommentError("ระบบยืนยันไม่พร้อม กรุณาลองใหม่",503);
  const result = await response.json();
  const expectedHost = new URL(headers.get("origin") || "https://invalid.local").hostname;
  if (!result.success || result.hostname !== expectedHost || result.action !== "comment") throw new ValidationCommentError("การยืนยันหมดอายุหรือไม่ถูกต้อง กรุณาลองใหม่");
}
export async function createGuestIdentity(headers: Headers, token?: string, displayName?: string) {
  assertCommentOrigin(headers);
  if (process.env.GUEST_COMMENTS_ENABLED === "false") throw new CommentError("ปิดรับผู้เยี่ยมชมชั่วคราว",503,"GUEST_DISABLED");
  await verifyCommentChallenge(headers,token);
  if (displayName !== undefined && (typeof displayName !== "string" || displayName.trim().length > 40)) throw new ValidationCommentError("ชื่อเล่นต้องไม่เกิน 40 ตัวอักษร");
  const opaque = randomBytes(32).toString("base64url");
  const code = randomBytes(6).toString("hex").toUpperCase();
  const expiresAt = new Date(Date.now()+GUEST_SESSION_SECONDS*1000);
  const actor = await db.transaction(async tx => {
    const [guest] = await tx.insert(commentGuests).values({publicCode:code,name:displayName?.trim() || `ผู้เยี่ยมชม #${code}`}).returning();
    const [session] = await tx.insert(commentGuestSessions).values({guestId:guest.id,tokenHash:hashGuestToken(opaque),expiresAt,verifiedUntil:new Date(Date.now()+10*60*1000)}).returning();
    return {kind:"guest" as const,guestId:guest.id,sessionId:session.id,name:guest.name,publicCode:code,verifiedUntil:session.verifiedUntil};
  });
  return {actor,token:opaque,expiresAt};
}
export async function ensureGuestVerification(actor: CommentActor, headers: Headers, token?: string, database: Pick<typeof db,"update"> = db) {
  if (actor.kind !== "guest" || (actor.verifiedUntil && actor.verifiedUntil.getTime()>Date.now())) return;
  await verifyCommentChallenge(headers,token);
  await database.update(commentGuestSessions).set({verifiedUntil:new Date(Date.now()+10*60*1000)}).where(eq(commentGuestSessions.id,actor.sessionId));
  actor.verifiedUntil=new Date(Date.now()+10*60*1000);
}

import { NextResponse } from "next/server";
import { readCommentJson } from "@/lib/comments/request";
import { resolveCommentActor, publicCommentActor, createGuestIdentity, guestCookieName, GUEST_SESSION_SECONDS, assertCommentOrigin, ensureGuestVerification } from "@/lib/comments/identity";
import { consumeGuestCreationLimit } from "@/lib/comments/abuse";
import { handleCommentError } from "@/lib/comments";

export async function GET(request:Request) {
  try {
    return NextResponse.json({actor:publicCommentActor(await resolveCommentActor(request.headers)),turnstileSiteKey:process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null},{headers:{"Cache-Control":"private, no-store"}});
  } catch(error) { return handleCommentError(error); }
}
export async function POST(request:Request) {
  try {
    assertCommentOrigin(request.headers);
    const body = await readCommentJson(request) as { challengeToken?: string; displayName?: string } | null;
    const existing = await resolveCommentActor(request.headers);
    if (existing) {
      await ensureGuestVerification(existing,request.headers,body?.challengeToken);
      return NextResponse.json({actor:publicCommentActor(existing)},{headers:{"Cache-Control":"private, no-store"}});
    }
    await consumeGuestCreationLimit(request.headers);
    const created = await createGuestIdentity(request.headers,body?.challengeToken,body?.displayName);
    const response = NextResponse.json({actor:publicCommentActor(created.actor)},{headers:{"Cache-Control":"private, no-store"}});
    response.cookies.set(guestCookieName(),created.token,{httpOnly:true,secure:process.env.NODE_ENV === "production",sameSite:"lax",path:"/",maxAge:GUEST_SESSION_SECONDS,expires:created.expiresAt});
    return response;
  } catch(error) { return handleCommentError(error); }
}

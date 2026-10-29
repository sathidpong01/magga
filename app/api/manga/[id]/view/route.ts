import { consentFromCookies } from "@/lib/privacy-consent";
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { recordMangaView } from '@/lib/manga-statistics';
import { checkRateLimit } from '@/lib/rate-limit';
import { getQuotaClientIp } from '@/lib/network-security';
import { z } from 'zod';
import { createHash } from 'crypto';
import {
  createVisitorId,
  getVisitorCookieOptions,
  VISITOR_COOKIE_NAME,
} from '@/lib/visitor-id';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

function getViewerKey(request: NextRequest, mangaId: string) {
  const cookieVisitorId = request.cookies.get(VISITOR_COOKIE_NAME)?.value;
  const validCookie = cookieVisitorId && /^[a-f0-9]{32}$/.test(cookieVisitorId) ? cookieVisitorId : undefined;
  const visitorId = validCookie || createVisitorId();
  const hashKey = (key: string) => createHash('sha256').update(`${key}:${mangaId}`).digest('hex').slice(0, 24);
  const viewerKey = hashKey(`visitor:${visitorId}`);

  return {
    viewerKey,
    visitorId,
    shouldSetCookie: !validCookie,
  };
}

function withVisitorCookie(response: NextResponse, visitorId: string, shouldSetCookie: boolean) {
  if (shouldSetCookie) {
    response.cookies.set(VISITOR_COOKIE_NAME, visitorId, getVisitorCookieOptions());
  }
  return response;
}

/**
 * POST /api/manga/[id]/view
 * Increment read count with DB-level dedup (persists across serverless invocations).
 * Uses a stable first-party visitor cookie per visitor per manga (10-minute dedup window).
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  if (consentFromCookies(request.headers.get("cookie")) !== true) {
    return new NextResponse(null, { status: 204, headers: { "Cache-Control": "private, no-store" } });
  }
  try {
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid manga ID" }, { status: 400 });
    // Bound cookie rotation abuse independently of the client-controlled visitor ID.
    const ip = getQuotaClientIp(request.headers);
    if (!ip) return NextResponse.json({ error: "Network identity unavailable" }, { status: 503 });
    const quotaKey = createHash('sha256').update(ip).digest('hex');
    const quota = await checkRateLimit(`view:${quotaKey}`, 240, 10 * 60 * 1000, { failClosed: true });
    if (!quota.allowed) return NextResponse.json({ error: "Too many view requests" }, {
      status: 429,
      headers: { 'Cache-Control': 'private, no-store', 'Retry-After': String(Math.max(1, Math.ceil(((quota.resetTime ?? Date.now() + 60000) - Date.now()) / 1000))) },
    });
    const { viewerKey, visitorId, shouldSetCookie } = getViewerKey(request, id);
    const result = await recordMangaView(db, id, viewerKey);
    if (!result) return NextResponse.json({ error: "Manga not found" }, { status: 404 });
    return withVisitorCookie(NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } }), visitorId, shouldSetCookie);
  } catch (error: any) {
    console.error("View increment error:", error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

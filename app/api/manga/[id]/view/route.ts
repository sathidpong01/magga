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
 * Basic views use only a per-opening event ID; consenting readers also get 10-minute visitor dedup.
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  const statisticsAllowed = consentFromCookies(request.headers.get("cookie")) === true;
  try {
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid manga ID" }, { status: 400 });
    const event = z.object({ eventId: z.uuid().optional() }).safeParse(
      request.body ? await request.json().catch(() => null) : {},
    );
    if (!event.success) return NextResponse.json({ error: "Invalid view event" }, { status: 400 });
    // Bound cookie rotation abuse independently of the client-controlled visitor ID.
    const ip = getQuotaClientIp(request.headers);
    if (!ip) {
      console.warn(JSON.stringify({ event: "manga_view", outcome: "failed", reason: "network_identity_unavailable", mangaId: id, status: 503 }));
      return NextResponse.json({ error: "Network identity unavailable" }, { status: 503 });
    }
    const quotaKey = createHash('sha256').update(ip).digest('hex');
    const quota = await checkRateLimit(`view:${quotaKey}`, 240, 10 * 60 * 1000, { failClosed: true });
    if (!quota.allowed) {
      // A fail-closed storage error has no quota reset time.
      if (quota.resetTime === undefined) {
        console.warn(JSON.stringify({ event: "manga_view", outcome: "failed", reason: "quota_unavailable", mangaId: id, status: 503 }));
        return NextResponse.json({ error: "View quota unavailable" }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
      }
      console.warn(JSON.stringify({ event: "manga_view", outcome: "rate_limited", mangaId: id, status: 429 }));
      return NextResponse.json({ error: "Too many view requests" }, {
        status: 429,
        headers: { 'Cache-Control': 'private, no-store', 'Retry-After': String(Math.max(1, Math.ceil((quota.resetTime - Date.now()) / 1000))) },
      });
    }
    const identity = statisticsAllowed ? getViewerKey(request, id) : null;
    const eventKey = createHash('sha256').update(`event:${event.data.eventId ?? createVisitorId()}:${id}`).digest('hex').slice(0, 24);
    const result = await recordMangaView(db, id, identity?.viewerKey ?? null, eventKey);
    if (!result) return NextResponse.json({ error: "Manga not found" }, { status: 404 });
    console.info(JSON.stringify({ event: "manga_view", outcome: result.deduplicated ? "deduplicated" : "counted", mangaId: id, status: 200 }));
    const response = NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
    return identity ? withVisitorCookie(response, identity.visitorId, identity.shouldSetCookie) : response;
  } catch (error: unknown) {
    console.error(JSON.stringify({ event: "manga_view", outcome: "failed", reason: "storage_error", status: 500, error: error instanceof Error ? error.name : "UnknownError" }));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

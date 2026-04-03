import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { manga as mangaTable } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
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

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

function getViewerKey(request: NextRequest, mangaId: string) {
  const cookieVisitorId = request.cookies.get(VISITOR_COOKIE_NAME)?.value;
  const visitorId = cookieVisitorId || createVisitorId();
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ip = getClientIP(request);
  const rawViewerKey = cookieVisitorId
    ? `visitor:${visitorId}`
    : `fallback:${ip}:${userAgent}`;
  const viewerKey = createHash('sha256')
    .update(`${rawViewerKey}:${mangaId}`)
    .digest('hex')
    .slice(0, 24);

  return {
    viewerKey,
    visitorId,
    shouldSetCookie: !cookieVisitorId,
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
 * Uses a stable first-party visitor cookie when available, with IP+UA fallback on first touch.
 * Dedup window is 10 minutes per visitor per manga.
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const { viewerKey, visitorId, shouldSetCookie } = getViewerKey(request, id);

    // Single atomic upsert: only increments view if last view was > 10 min ago
    const dedupResult = await db.execute(sql`
      INSERT INTO manga_views (manga_id, ip_hash, viewed_at)
      VALUES (${id}::uuid, ${viewerKey}, NOW())
      ON CONFLICT (manga_id, ip_hash) DO UPDATE 
        SET viewed_at = NOW()
        WHERE manga_views.viewed_at < NOW() - INTERVAL '10 minutes'
      RETURNING true AS is_new
    `);

    const isNewView = dedupResult.length > 0;

    if (!isNewView) {
      return withVisitorCookie(
        NextResponse.json({ viewCount: -1, deduplicated: true }),
        visitorId,
        shouldSetCookie
      );
    }

    // Atomic increment
    const [updatedManga] = await db
      .update(mangaTable)
      .set({
        viewCount: sql`${mangaTable.viewCount} + 1`,
      })
      .where(eq(mangaTable.id, id))
      .returning({ viewCount: mangaTable.viewCount });

    if (!updatedManga) {
      return withVisitorCookie(
        NextResponse.json(
          { error: 'Manga not found' },
          { status: 404 }
        ),
        visitorId,
        shouldSetCookie
      );
    }

    return withVisitorCookie(
      NextResponse.json({
        viewCount: updatedManga.viewCount,
      }),
      visitorId,
      shouldSetCookie
    );
  } catch (error: any) {
    console.error("View increment error:", error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

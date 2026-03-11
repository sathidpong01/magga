import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { manga as mangaTable } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { createHash } from 'crypto';

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

/**
 * POST /api/manga/[id]/view
 * Increment view count with DB-level dedup (persists across serverless invocations).
 * Uses manga_views table to track IP hashes per manga with 10-minute cooldown.
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const ip = getClientIP(request);
    // Hash IP for privacy — only store first 16 chars of SHA-256
    const ipHash = createHash('sha256').update(ip + id).digest('hex').slice(0, 16);

    // Single atomic upsert: only increments view if last view was > 10 min ago
    const dedupResult = await db.execute(sql`
      INSERT INTO manga_views (manga_id, ip_hash, viewed_at)
      VALUES (${id}::uuid, ${ipHash}, NOW())
      ON CONFLICT (manga_id, ip_hash) DO UPDATE 
        SET viewed_at = NOW()
        WHERE manga_views.viewed_at < NOW() - INTERVAL '10 minutes'
      RETURNING true AS is_new
    `);

    const isNewView = dedupResult.length > 0;

    if (!isNewView) {
      return NextResponse.json({ viewCount: -1, deduplicated: true });
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
      return NextResponse.json(
        { error: 'Manga not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      viewCount: updatedManga.viewCount,
    });
  } catch (error: any) {
    console.error("View increment error:", error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

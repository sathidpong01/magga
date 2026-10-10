import { z } from "zod";
import { recordMangaRating } from "@/lib/manga-statistics";
import { checkRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { manga as mangaTable, mangaRatings as mangaRatingsTable } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createHash } from 'crypto';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * Hash fingerprint or IP using SHA-256
 */
function hashString(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Get client IP address from request headers
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip');
  
  return (
    cfIP ||
    realIP ||
    (forwarded ? forwarded.split(',')[0].trim() : '') ||
    'unknown'
  );
}

/**
 * GET /api/manga/[id]/rating?fingerprint=xxx
 * ดึงข้อมูลคะแนนของมังงะและคะแนนที่ผู้ใช้เคยให้ (ถ้ามี)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid manga ID" }, { status: 400 });
    const { searchParams } = new URL(request.url);
    const fingerprint = searchParams.get('fingerprint');
    if (fingerprint && fingerprint.length > 256) return NextResponse.json({ error: 'Invalid fingerprint' }, { status: 400 });

    // ดึงข้อมูลมังงะ
    const manga = await db.query.manga.findFirst({
      where: and(eq(mangaTable.id, id), eq(mangaTable.isHidden, false)),
      columns: {
        id: true,
        averageRating: true,
        ratingCount: true,
      },
    });

    if (!manga) {
      return NextResponse.json(
        { error: 'Manga not found' },
        { status: 404 }
      );
    }

    let userRating = null;

    // ถ้ามี fingerprint ให้ตรวจสอบว่าผู้ใช้เคยให้คะแนนหรือไม่
    if (fingerprint) {
      const hashedFingerprint = hashString(fingerprint);
      const existingRating = await db.query.mangaRatings.findFirst({
        where: and(
          eq(mangaRatingsTable.mangaId, id),
          eq(mangaRatingsTable.fingerprint, hashedFingerprint)
        ),
        columns: {
          rating: true,
        },
      });

      userRating = existingRating?.rating || null;
    }

    return NextResponse.json({
      averageRating: manga.averageRating,
      ratingCount: Number(manga.ratingCount),
      userRating,
    }, {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error("Fetch rating error:", error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manga/[id]/rating
 * เพิ่มหรืออัพเดทคะแนนมังงะ (ใช้ Hybrid Approach)
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid manga ID" }, { status: 400 });
    const body = await request.json();
    const { rating, fingerprint } = body;

    // Validate inputs
    if (!fingerprint || typeof fingerprint !== 'string' || fingerprint.length > 256) {
      return NextResponse.json(
        { error: 'Fingerprint is required' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const hashedIP = hashString(getClientIP(request));
    const quota = await checkRateLimit(`rating:${hashedIP}`, 60, 60 * 60 * 1000, { failClosed: true });
    if (!quota.allowed) return NextResponse.json({ error: "Too many rating requests" }, { status: 429 });
    const result = await recordMangaRating(db, id, rating, hashString(fingerprint), hashedIP);
    if (!result) return NextResponse.json({ error: "Manga not found" }, { status: 404 });
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Update rating error:", error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

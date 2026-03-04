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
    const { searchParams } = new URL(request.url);
    const fingerprint = searchParams.get('fingerprint');

    // ดึงข้อมูลมังงะ
    const manga = await db.query.manga.findFirst({
      where: eq(mangaTable.id, id),
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
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
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
    const body = await request.json();
    const { rating, fingerprint } = body;

    // Validate inputs
    if (!fingerprint || typeof fingerprint !== 'string') {
      return NextResponse.json(
        { error: 'Fingerprint is required' },
        { status: 400 }
      );
    }

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx) => {
      // ตรวจสอบว่ามังงะมีอยู่จริง
      const manga = await tx.query.manga.findFirst({
        where: eq(mangaTable.id, id),
        columns: { id: true, ratingSum: true, ratingCount: true },
      });

      if (!manga) {
        return { error: 'Manga not found', status: 404 };
      }

      // Hash fingerprint และ IP
      const hashedFingerprint = hashString(fingerprint);
      const clientIP = getClientIP(request);
      const hashedIP = hashString(clientIP);

      // ตรวจสอบว่าผู้ใช้เคยให้คะแนนหรือยัง
      const existingRating = await tx.query.mangaRatings.findFirst({
        where: and(
          eq(mangaRatingsTable.mangaId, id),
          eq(mangaRatingsTable.fingerprint, hashedFingerprint)
        ),
      });

      let newRatingSum: number;
      let newRatingCount: number;

      if (existingRating) {
        // อัพเดทคะแนนเดิม - คำนวณ delta
        const delta = rating - existingRating.rating;
        newRatingSum = Number(manga.ratingSum) + delta;
        newRatingCount = Number(manga.ratingCount); // ไม่เปลี่ยน

        // อัพเดท MangaRating
        await tx.update(mangaRatingsTable).set({
          rating,
          ipAddress: hashedIP, // อัพเดท IP ล่าสุด
          updatedAt: new Date().toISOString(),
        }).where(
          and(
            eq(mangaRatingsTable.mangaId, id),
            eq(mangaRatingsTable.fingerprint, hashedFingerprint)
          )
        );
      } else {
        // สร้างคะแนนใหม่
        newRatingSum = Number(manga.ratingSum) + rating;
        newRatingCount = Number(manga.ratingCount) + 1;

        // สร้าง MangaRating ใหม่
        await tx.insert(mangaRatingsTable).values({
          mangaId: id,
          fingerprint: hashedFingerprint,
          ipAddress: hashedIP,
          rating,
        });
      }

      // คำนวณคะแนนเฉลี่ยใหม่
      const newAverageRating = newRatingCount > 0 
        ? newRatingSum / newRatingCount 
        : 0;

      // อัพเดทข้อมูลในตาราง Manga
      await tx.update(mangaTable).set({
        ratingSum: newRatingSum,
        ratingCount: newRatingCount,
        averageRating: newAverageRating,
      }).where(eq(mangaTable.id, id));

      return {
        data: {
          averageRating: newAverageRating,
          ratingCount: newRatingCount,
          userRating: rating,
          message: existingRating ? 'Rating updated' : 'Rating added',
        }
      };
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Update rating error:", error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

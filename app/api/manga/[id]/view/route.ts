import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// In-memory dedup: prevent same IP from inflating views (1 view per IP per manga per 10 min)
const VIEW_DEDUP_TTL = 10 * 60 * 1000;
const viewDedup = new Map<string, number>();

// Periodically clean stale entries
function cleanViewDedup() {
  if (viewDedup.size > 5000) {
    const now = Date.now();
    for (const [key, expires] of viewDedup) {
      if (now >= expires) viewDedup.delete(key);
    }
  }
}

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
 * เพิ่มยอดวิวให้กับมังงะ
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const ip = getClientIP(request);
    const dedupKey = `${id}:${ip}`;

    // Check dedup — skip increment if recently viewed
    const existing = viewDedup.get(dedupKey);
    if (existing && Date.now() < existing) {
      return NextResponse.json({ viewCount: -1, deduplicated: true });
    }

    // Mark as viewed
    viewDedup.set(dedupKey, Date.now() + VIEW_DEDUP_TTL);
    cleanViewDedup();

    // Atomic increment — no separate findUnique needed
    const updatedManga = await prisma.manga.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
      select: {
        viewCount: true,
      },
    });

    return NextResponse.json({
      viewCount: updatedManga.viewCount,
    });
  } catch (error: any) {
    // Prisma P2025 = record not found
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Manga not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

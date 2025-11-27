import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

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

    // ตรวจสอบว่ามังงะมีอยู่จริง
    const manga = await prisma.manga.findUnique({
      where: { id },
      select: { id: true, viewCount: true },
    });

    if (!manga) {
      return NextResponse.json(
        { error: 'Manga not found' },
        { status: 404 }
      );
    }

    // เพิ่ม viewCount โดยใช้ atomic increment
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
  } catch (error) {
    console.error('Failed to increment view count:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

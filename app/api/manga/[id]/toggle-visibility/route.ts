import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getServerSession();
  if (!session || session.user?.role?.toUpperCase() !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Get current manga to toggle its visibility
    const currentManga = await prisma.manga.findUnique({
      where: { id },
      select: { isHidden: true },
    });

    if (!currentManga) {
      return NextResponse.json({ error: 'Manga not found' }, { status: 404 });
    }

    // Toggle the visibility
    const updatedManga = await prisma.manga.update({
      where: { id },
      data: {
        isHidden: !currentManga.isHidden,
      },
    });

    return NextResponse.json(updatedManga);
  } catch (error) {
    console.error('Failed to toggle manga visibility:', error);
    return NextResponse.json({ error: 'Failed to toggle visibility' }, { status: 500 });
  }
}

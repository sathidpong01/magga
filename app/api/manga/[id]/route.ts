import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await request.json();
  const { title, description, categoryId, selectedTags, coverImage, pages, isHidden } = data;
  const { id } = await params;

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  try {
    const updatedManga = await prisma.manga.update({
      where: { id },
      data: {
        title,
        description,
        categoryId,
        tags: {
          set: selectedTags.map((tagId: string) => ({ id: tagId })),
        },
        coverImage: coverImage || undefined,
        pages: pages ? JSON.stringify(pages) : undefined,
        isHidden: isHidden,
      },
    });
    return NextResponse.json(updatedManga);
  } catch (error) {
    console.error('Failed to update manga:', error);
    return NextResponse.json({ error: 'Failed to update manga' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.manga.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete manga:', error);
    return NextResponse.json({ error: 'Failed to delete manga' }, { status: 500 });
  }
}

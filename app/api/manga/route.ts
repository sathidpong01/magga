import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.json();
  const { title, description, categoryId, selectedTags, coverImage, pages } = data;

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  try {
    const newManga = await prisma.manga.create({
      data: {
        title,
        description,
        categoryId,
        tags: {
          connect: selectedTags.map((tagId: string) => ({ id: tagId })),
        },
        coverImage: coverImage || 'https://via.placeholder.com/300x400.png?text=Cover',
        pages: JSON.stringify(pages || []),
      },
    });
    return NextResponse.json(newManga, { status: 201 });
  } catch (error) {
    console.error('Failed to create manga:', error);
    return NextResponse.json({ error: 'Failed to create manga' }, { status: 500 });
  }
}

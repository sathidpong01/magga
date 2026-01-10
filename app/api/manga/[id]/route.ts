import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role?.toUpperCase() !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = await params;
  const data = await request.json();
  const { title, description, categoryId, authorId, selectedTags, coverImage, pages, isHidden, authorCredits, authorName, slug } = data;

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  try {
    // Check if slug exists and belongs to another manga
    if (slug) {
      const existingSlug = await prisma.manga.findFirst({
        where: {
          slug,
          NOT: { id },
        },
      });
      if (existingSlug) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
      }
    }

    const updatedManga = await prisma.manga.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        categoryId,
        authorId,
        tags: {
          set: selectedTags.map((tagId: string) => ({ id: tagId })),
        },
        coverImage: coverImage || undefined,
        pages: pages ? JSON.stringify(pages) : undefined,
        isHidden: isHidden,
        authorCredits,
        authorName,
      },
    });
    revalidatePath('/admin');
    revalidatePath('/');
    if (updatedManga.slug) {
      revalidatePath(`/${updatedManga.slug}`);
    }
    return NextResponse.json(updatedManga);
  } catch (error) {

    return NextResponse.json({ error: 'Failed to update manga' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role?.toUpperCase() !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.manga.delete({
      where: { id },
    });
    revalidatePath('/admin');
    return new NextResponse(null, { status: 204 });
  } catch (error) {

    return NextResponse.json({ error: 'Failed to delete manga' }, { status: 500 });
  }
}

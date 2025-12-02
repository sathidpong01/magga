import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { z } from 'zod';

const mangaSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  selectedTags: z.array(z.string()),
  coverImage: z.string().url().optional(),
  pages: z.array(z.string().url()).optional(),
  isHidden: z.boolean().optional(),
  authorCredits: z.string().optional(),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role?.toUpperCase() !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = mangaSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const { title, description, categoryId, selectedTags, coverImage, pages, isHidden, authorCredits, slug } = result.data;

    // Check if slug exists
    const existingSlug = await prisma.manga.findUnique({ where: { slug } });
    if (existingSlug) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    const newManga = await prisma.manga.create({
      data: {
        title,
        slug,
        description,
        categoryId,
        tags: {
          connect: selectedTags.map((tagId: string) => ({ id: tagId })),
        },
        coverImage: coverImage || 'https://via.placeholder.com/300x400.png?text=Cover',
        pages: JSON.stringify(pages || []),
        isHidden: isHidden || false,
        authorCredits,
      },
    });
    revalidatePath('/admin');
    return NextResponse.json(newManga, { status: 201 });
  } catch (error) {
    console.error('Failed to create manga:', error);
    return NextResponse.json({ error: 'Failed to create manga' }, { status: 500 });
  }
}

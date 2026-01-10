import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { revalidatePath } from 'next/cache';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// GET a single author
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const author = await prisma.author.findUnique({
      where: { id },
      include: {
        _count: {
          select: { mangas: true },
        },
      },
    });

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    return NextResponse.json(author);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch author' }, { status: 500 });
  }
}

// PUT to update an author (admin only)
export async function PUT(request: Request, { params }: RouteParams) {
  const session = await getServerSession();
  if (!session || session.user?.role?.toUpperCase() !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, profileUrl, iconUrl } = await request.json();
  const { id } = await params;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  try {
    const updatedAuthor = await prisma.author.update({
      where: { id },
      data: {
        name: name.trim(),
        profileUrl: profileUrl ?? undefined,
        iconUrl: iconUrl ?? undefined,
      },
    });
    revalidatePath('/admin/categories');
    return NextResponse.json(updatedAuthor);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Author name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update author' }, { status: 500 });
  }
}

// DELETE an author (admin only)
export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await getServerSession();
  if (!session || session.user?.role?.toUpperCase() !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.author.delete({
      where: { id },
    });
    revalidatePath('/admin/categories');
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Failed to delete author. It might be in use.' }, { status: 500 });
  }
}

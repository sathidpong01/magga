import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';

type RouteParams = {
  params: {
    id: string;
  };
};

// PUT to update a tag
export async function PUT(request: Request, { params }: RouteParams) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await request.json();
  const { id } = params;

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  try {
    const updatedTag = await prisma.tag.update({
      where: { id },
      data: { name },
    });
    return NextResponse.json(updatedTag);
  } catch {
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
  }
}

// DELETE a tag
export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    await prisma.tag.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 }); // No Content
  } catch {
    return NextResponse.json({ error: 'Failed to delete tag. It might be in use.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { revalidatePath } from 'next/cache';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// PUT to update a category
export async function PUT(request: Request, { params }: RouteParams) {
  const session = await getServerSession();
  if (!session || session.user?.role?.toUpperCase() !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await request.json();
  const { id } = await params;

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  try {
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { name },
    });
    revalidatePath('/admin/metadata');
    return NextResponse.json(updatedCategory);
  } catch {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE a category
export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await getServerSession();
  if (!session || session.user?.role?.toUpperCase() !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.category.delete({
      where: { id },
    });
    revalidatePath('/admin/metadata');
    return new NextResponse(null, { status: 204 }); // No Content
  } catch {
    // Handle cases where the category is still in use
    return NextResponse.json({ error: 'Failed to delete category. It might be in use.' }, { status: 500 });
  }
}

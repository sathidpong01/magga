import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';

// GET all categories
export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(categories);
}

// POST a new category
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role?.toUpperCase() !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await request.json();

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  try {
    const newCategory = await prisma.category.create({
      data: { name },
    });
    revalidatePath('/admin/metadata');
    return NextResponse.json(newCategory, { status: 201 });
  } catch {
    // Handle potential errors, e.g., unique constraint violation
    return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
  }
}

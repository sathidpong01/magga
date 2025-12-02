import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

// GET all tags
export async function GET() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(tags);
}

// POST a new tag
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
    const newTag = await prisma.tag.create({
      data: { name },
    });
    return NextResponse.json(newTag, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Tag already exists' }, { status: 409 });
  }
}

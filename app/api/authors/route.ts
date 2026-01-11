import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-helpers";
import { sanitizeInput } from "@/lib/sanitize";

// GET all authors
export async function GET() {
  const authors = await prisma.author.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(authors);
}

// POST a new author
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const authError = requireAuth(session); // Allow authenticated users to create authors
  if (authError) return authError;

  const { name, profileUrl, socialLinks } = await request.json();
  const sanitizedName = sanitizeInput(name);

  if (!sanitizedName || sanitizedName.length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const newAuthor = await prisma.author.create({
      data: {
        name: sanitizedName,
        profileUrl: profileUrl || null,
        socialLinks: socialLinks || null,
      },
    });
    revalidatePath("/admin/categories");
    revalidatePath("/submit");
    return NextResponse.json(newAuthor, { status: 201 });
  } catch (error: any) {
    // Handle unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Author already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create author" },
      { status: 500 }
    );
  }
}

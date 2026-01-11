import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { sanitizeInput } from "@/lib/sanitize";

// GET all categories
export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}

// POST a new category
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const authError = requireAdmin(session);
  if (authError) return authError;

  const { name } = await request.json();
  const sanitizedName = sanitizeInput(name);

  if (!sanitizedName) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const newCategory = await prisma.category.create({
      data: { name: sanitizedName },
    });
    revalidatePath("/admin/metadata");
    revalidatePath("/"); // Refresh home page to show new category
    return NextResponse.json(newCategory, { status: 201 });
  } catch {
    // Handle potential errors, e.g., unique constraint violation
    return NextResponse.json(
      { error: "Category already exists" },
      { status: 409 }
    );
  }
}

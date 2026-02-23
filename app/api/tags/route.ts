import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { sanitizeInput } from "@/lib/sanitize";

// GET all tags
export async function GET() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(tags);
}

// POST a new tag
export async function POST(request: Request) {
  const session = await auth();
  const authError = requireAdmin(session);
  if (authError) return authError;

  const { name } = await request.json();
  const sanitizedName = sanitizeInput(name);

  if (!sanitizedName) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const newTag = await prisma.tag.create({
      data: { name: sanitizedName },
    });
    revalidatePath("/admin/metadata");
    revalidatePath("/"); // Refresh home page to show new tag
    return NextResponse.json(newTag, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Tag already exists" }, { status: 409 });
  }
}

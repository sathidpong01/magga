import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories as categoriesTable } from "@/db/schema";
import { asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { sanitizeInput } from "@/lib/sanitize";

// GET all categories
export async function GET() {
  const categories = await db.query.categories.findMany({
    orderBy: [asc(categoriesTable.name)],
  });
  return NextResponse.json(categories);
}

// POST a new category
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const authError = requireAdmin(session);
  if (authError) return authError;

  const { name } = await request.json();
  const sanitizedName = sanitizeInput(name);

  if (!sanitizedName) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const [newCategory] = await db.insert(categoriesTable)
      .values({ name: sanitizedName })
      .returning();
    revalidatePath("/dashboard/admin/metadata");
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

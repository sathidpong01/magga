import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories as categoriesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// PUT to update a category
export async function PUT(request: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: request.headers });
  const authError = requireAdmin(session);
  if (authError) return authError;
  
  const { name } = await request.json();
  const { id } = await params;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const [updatedCategory] = await db.update(categoriesTable)
      .set({ name })
      .where(eq(categoriesTable.id, id))
      .returning();
    revalidatePath("/dashboard/admin/metadata");
    return NextResponse.json(updatedCategory);
  } catch {
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE a category
export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: request.headers });
  const authError = requireAdmin(session);
  if (authError) return authError;
  
  const { id } = await params;
  
  try {
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    revalidatePath("/dashboard/admin/metadata");
    return new NextResponse(null, { status: 204 }); // No Content
  } catch {
    // Handle cases where the category is still in use
    return NextResponse.json(
      { error: "Failed to delete category. It might be in use." },
      { status: 500 }
    );
  }
}

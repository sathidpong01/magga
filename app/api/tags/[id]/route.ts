import { NextResponse } from "next/server";
import { db } from "@/db";
import { tags as tagsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// PUT to update a tag
export async function PUT(request: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || (session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await request.json();
  const { id } = await params;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const [updatedTag] = await db.update(tagsTable)
      .set({ name })
      .where(eq(tagsTable.id, id))
      .returning();
    revalidatePath("/admin/metadata");
    return NextResponse.json(updatedTag);
  } catch {
    return NextResponse.json(
      { error: "Failed to update tag" },
      { status: 500 }
    );
  }
}

// DELETE a tag
export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || (session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await db.delete(tagsTable).where(eq(tagsTable.id, id));
    revalidatePath("/admin/metadata");
    return new NextResponse(null, { status: 204 }); // No Content
  } catch {
    return NextResponse.json(
      { error: "Failed to delete tag. It might be in use." },
      { status: 500 }
    );
  }
}

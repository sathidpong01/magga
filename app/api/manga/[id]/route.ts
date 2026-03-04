import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { manga as mangaTable, mangaTags as mangaTagsTable } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || (session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await request.json();
  const { title, description, categoryId, authorId, selectedTags, coverImage, pages, isHidden, authorName, slug } = data;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  try {
    // Check if slug exists and belongs to another manga
    if (slug) {
      const [existingSlug] = await db
        .select({ id: mangaTable.id })
        .from(mangaTable)
        .where(and(eq(mangaTable.slug, slug), ne(mangaTable.id, id)))
        .limit(1);

      if (existingSlug) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
      }
    }

    // Update manga
    const [updatedManga] = await db
      .update(mangaTable)
      .set({
        title,
        slug,
        description,
        categoryId: categoryId || null,
        authorId: authorId || null,
        coverImage: coverImage || undefined,
        pages: pages ? JSON.stringify(pages) : undefined,
        isHidden,
        authorName,
      })
      .where(eq(mangaTable.id, id))
      .returning();

    // Update tags: delete old, insert new
    await db.delete(mangaTagsTable).where(eq(mangaTagsTable.mangaId, id));
    if (selectedTags && selectedTags.length > 0) {
      await db.insert(mangaTagsTable).values(
        selectedTags.map((tagId: string) => ({ mangaId: id, tagId }))
      );
    }

    revalidatePath("/admin");
    revalidatePath("/");
    if (updatedManga.slug) {
      revalidatePath(`/${updatedManga.slug}`);
    }

    return NextResponse.json(updatedManga);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update manga" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || (session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await db.delete(mangaTable).where(eq(mangaTable.id, id));
    revalidatePath("/admin");
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete manga" }, { status: 500 });
  }
}

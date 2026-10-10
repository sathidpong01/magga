import { mangaInputSchema } from "@/lib/manga-input";
import { invalidateMangaContent } from "@/lib/manga-invalidation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { manga as mangaTable, mangaTags as mangaTagsTable } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { removeMangaWithComments } from "@/lib/comments/manga-removal";
import { requireModerationAdmin } from "@/lib/comments/moderation";
import { handleCommentError } from "@/lib/comments";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers, query: { disableCookieCache: true } });
  const authError = requireAdmin(session);
  if (authError) return authError;

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid manga ID" }, { status: 400 });
  const parsed = mangaInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid manga data", details: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;
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

    const result = await db.transaction(async tx => {
    const [before] = await tx.select({ slug: mangaTable.slug }).from(mangaTable).where(eq(mangaTable.id,id)).for("update");
    if (!before) return null;
    const [updatedManga] = await tx
      .update(mangaTable)
      .set({
        title,
        slug,
        description,
        categoryId: categoryId || null,
        authorId: authorId || null,
        coverImage: coverImage || undefined,
        pages: pages ?? undefined,
        isHidden,
        authorName,
      })
      .where(eq(mangaTable.id, id))
      .returning();

    // Update tags: delete old, insert new
    await tx.delete(mangaTagsTable).where(eq(mangaTagsTable.mangaId, id));
    if (selectedTags && selectedTags.length > 0) {
      await tx.insert(mangaTagsTable).values(
        selectedTags.map((tagId: string) => ({ mangaId: id, tagId }))
      );
    }

    return { before, updatedManga };
    });
    if (!result) return NextResponse.json({ error: "Manga not found" }, { status: 404 });
    const refreshed = invalidateMangaContent([result.before.slug, result.updatedManga.slug]);
    return NextResponse.json({ ...result.updatedManga, cache_refresh_pending: !refreshed });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update manga" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireModerationAdmin(request, true); }
  catch (error) { return handleCommentError(error); }

  const { id } = await params;

  try {
    if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid manga ID" }, { status: 400 });
    const [before] = await db.select({ slug: mangaTable.slug }).from(mangaTable).where(eq(mangaTable.id, id));
    await removeMangaWithComments([id]);
    const refreshed = invalidateMangaContent([before?.slug]);
    return new NextResponse(null, { status: 204, headers: { "X-Magga-Cache-Refresh-Pending": String(!refreshed) } });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete manga" }, { status: 500 });
  }
}

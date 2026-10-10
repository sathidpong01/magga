import { NextResponse } from "next/server";
import { db } from "@/db";
import { manga as mangaTable, mangaTags as mangaTagsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth-helpers";
import { mangaInputSchema } from "@/lib/manga-input";
import { invalidateMangaContent } from "@/lib/manga-invalidation";

const mangaSchema = mangaInputSchema;

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers, query: { disableCookieCache: true } });
  const authError = requireAdmin(session);
  if (authError) return authError;

  try {
    const body = await request.json();
    const result = mangaSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      categoryId,
      authorId,
      selectedTags,
      coverImage,
      pages,
      isHidden,
      authorName,
      slug,
    } = result.data;

    // Check if slug exists
    const [existingSlug] = await db
      .select({ id: mangaTable.id })
      .from(mangaTable)
      .where(eq(mangaTable.slug, slug))
      .limit(1);

    if (existingSlug) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 400 }
      );
    }

    const newManga = await db.transaction(async tx => {
    const [created] = await tx
      .insert(mangaTable)
      .values({
        title,
        slug,
        description,
        categoryId: categoryId || null,
        authorId: authorId || null,
        coverImage: coverImage || "https://via.placeholder.com/300x400.png?text=Cover",
        pages: pages || [],
        isHidden: isHidden || false,
        authorName: authorName || null,
      })
      .returning();

    // Add tags if any
    if (selectedTags.length > 0) {
      await tx.insert(mangaTagsTable).values(
        selectedTags.map((tagId) => ({
          mangaId: created.id,
          tagId,
        }))
      );
    }

    return created;
    });
    const refreshed = invalidateMangaContent([newManga.slug]);
    return NextResponse.json({ ...newManga, cache_refresh_pending: !refreshed }, { status: 201 });
  } catch (error) {
    console.error("Error creating manga:", error);
    return NextResponse.json(
      { error: "Failed to create manga" },
      { status: 500 }
    );
  }
}

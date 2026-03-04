import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { manga as mangaTable, categories as categoriesTable, tags as tagsTable, authors as authorsTable, mangaTags as mangaTagsTable } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth-helpers";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const authError = requireAdmin(session);
    if (authError) return authError;

    const body = await req.json();
    const { id, categoryName, tagNames, authorName } = body as {
      id: string;
      categoryName?: string;
      tagNames?: string[];
      authorName?: string;
    };

    if (!id) {
      return NextResponse.json(
        { error: "Manga ID is required" },
        { status: 400 }
      );
    }

    // Find category by name
    let categoryId = null;
    if (categoryName) {
      const [category] = await db
        .select({ id: categoriesTable.id })
        .from(categoriesTable)
        .where(eq(categoriesTable.name, categoryName))
        .limit(1);
      categoryId = category?.id || null;
    }

    // Find tags by names
    let tagIds: string[] = [];
    if (tagNames && tagNames.length > 0) {
      const foundTags = await db
        .select({ id: tagsTable.id })
        .from(tagsTable)
        .where(inArray(tagsTable.name, tagNames));
      tagIds = foundTags.map((t) => t.id);
    }

    // Find author by name
    let authorId = null;
    if (authorName) {
      const [author] = await db
        .select({ id: authorsTable.id })
        .from(authorsTable)
        .where(eq(authorsTable.name, authorName))
        .limit(1);
      authorId = author?.id || null;
    }

    // Update manga
    const [updatedManga] = await db
      .update(mangaTable)
      .set({ categoryId, authorId })
      .where(eq(mangaTable.id, id))
      .returning();

    // Update tags: delete old and insert new
    await db.delete(mangaTagsTable).where(eq(mangaTagsTable.mangaId, id));
    if (tagIds.length > 0) {
      await db.insert(mangaTagsTable).values(
        tagIds.map((tagId) => ({ mangaId: id, tagId }))
      );
    }

    // Fetch with relations for response
    const mangaWithRelations = await db.query.manga.findFirst({
      where: eq(mangaTable.id, id),
      with: {
        category: true,
        author: true,
        mangaTags_mangaId: {
          with: { tag_tagId: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      manga: {
        ...mangaWithRelations,
        tags: mangaWithRelations?.mangaTags_mangaId.map((mt: any) => mt.tag_tagId) || [],
      },
    });
  } catch (error) {
    console.error("Quick edit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

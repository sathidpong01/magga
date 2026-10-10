import { NextResponse } from "next/server";
import { db } from "@/db";
import { authors as authorsTable, manga as mangaTable } from "@/db/schema";
import { eq, count, and } from "drizzle-orm";
import { authenticateRequest } from "@/lib/auth-helpers";
import { invalidateMangaContent } from "@/lib/manga-invalidation";
import { UUID_PATTERN } from "@/lib/manga-query";
import { sanitizeInput } from "@/lib/sanitize";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// GET a single author
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: "Invalid identifier" }, { status: 400 });

  try {
    const author = await db.query.authors.findFirst({
      where: eq(authorsTable.id, id),
    });

    if (!author) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    // Count mangas by this author
    const [{ mangaCount }] = await db
      .select({ mangaCount: count() })
      .from(mangaTable)
      .where(and(eq(mangaTable.authorId, id), eq(mangaTable.isHidden, false)));

    return NextResponse.json({ ...author, _count: { mangas: Number(mangaCount) } });
  } catch {
    return NextResponse.json({ error: "Failed to fetch author" }, { status: 500 });
  }
}

// PUT to update an author (admin only)
export async function PUT(request: Request, { params }: RouteParams) {
  const authorization = await authenticateRequest(request, { role: "admin" });
  if (!authorization.ok) return authorization.response;

  const { name, profileUrl, socialLinks } = await request.json().catch(() => ({}));
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: "Invalid identifier" }, { status: 400 });

  if (!name || typeof name !== "string" || !sanitizeInput(name).trim() || name.length > 100) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const updatedAuthor = await db.transaction(async (transaction) => {
      const [updated] = await transaction.update(authorsTable).set({
        name: sanitizeInput(name).trim(), profileUrl: profileUrl ?? null, socialLinks: socialLinks ?? null,
      }).where(eq(authorsTable.id, id)).returning();
      if (updated) {
        // Keep the legacy fallback and FTS source aligned with the canonical relation.
        await transaction.update(mangaTable).set({ authorName: updated.name }).where(eq(mangaTable.authorId, id));
      }
      return updated;
    });

    if (!updatedAuthor) return NextResponse.json({ error: "Author not found" }, { status: 404 });
    const cacheRefreshed = invalidateMangaContent();
    return NextResponse.json({ ...updatedAuthor, cache_refresh_pending: !cacheRefreshed });
  } catch (error: any) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Author name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update author" }, { status: 500 });
  }
}

// DELETE an author (admin only)
export async function DELETE(request: Request, { params }: RouteParams) {
  const authorization = await authenticateRequest(request, { role: "admin" });
  if (!authorization.ok) return authorization.response;

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: "Invalid identifier" }, { status: 400 });

  try {
    await db.delete(authorsTable).where(eq(authorsTable.id, id));
    const cacheRefreshed = invalidateMangaContent();
    return new NextResponse(null, { status: 204, headers: cacheRefreshed ? {} : { "X-Magga-Cache-Refresh": "pending" } });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete author. It might be in use." },
      { status: 500 }
    );
  }
}

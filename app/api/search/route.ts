import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { manga as mangaTable } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * GET /api/search?q=<query>
 * Uses PostgreSQL full-text search (tsvector + GIN index) instead of Fuse.js.
 * Falls back to ILIKE for short queries or non-English text (e.g., Thai).
 */
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim();

    // No query — return empty
    if (!q || q.length < 2) {
      return NextResponse.json([], {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      });
    }

    // Try FTS first, fall back to ILIKE for non-Latin text (Thai, etc.)
    const hasLatinChars = /[a-zA-Z]/.test(q);

    let results;

    if (hasLatinChars) {
      // PostgreSQL FTS with GIN index — fast for English text
      results = await db.query.manga.findMany({
        where: and(
          eq(mangaTable.isHidden, false),
          sql`${mangaTable.fts} @@ plainto_tsquery('english', ${q})`
        ),
        orderBy: sql`ts_rank(${mangaTable.fts}, plainto_tsquery('english', ${q})) DESC`,
        limit: 10,
        columns: {
          id: true,
          slug: true,
          title: true,
          description: true,
          coverImage: true,
          authorName: true,
        },
        with: {
          category: {
            columns: { name: true },
          },
        },
      });
    }

    // Fall back to ILIKE if FTS returned nothing or query is non-Latin
    if (!results || results.length === 0) {
      results = await db.query.manga.findMany({
        where: and(
          eq(mangaTable.isHidden, false),
          sql`(${mangaTable.title} ILIKE ${'%' + q + '%'} OR ${mangaTable.authorName} ILIKE ${'%' + q + '%'})`
        ),
        limit: 10,
        columns: {
          id: true,
          slug: true,
          title: true,
          description: true,
          coverImage: true,
          authorName: true,
        },
        with: {
          category: {
            columns: { name: true },
          },
        },
      });
    }

    const mapped = results.map((manga) => ({
      id: manga.id,
      slug: manga.slug,
      title: manga.title,
      description: (manga.description || "").slice(0, 100),
      coverImage: manga.coverImage,
      authorName: manga.authorName || "",
      category: manga.category?.name || "",
    }));

    return NextResponse.json(mapped, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json(
      { error: "Failed to search" },
      { status: 500 }
    );
  }
}

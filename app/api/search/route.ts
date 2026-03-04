import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { manga as mangaTable } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import Fuse from "fuse.js";

// Cache search index for 5 minutes
const getSearchIndex = unstable_cache(
  async () => {
    const mangas = await db.query.manga.findMany({
      where: eq(mangaTable.isHidden, false),
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
        mangaTags_mangaId: {
          with: {
            tag_tagId: {
              columns: { name: true },
            },
          },
        },
      },
      orderBy: [desc(mangaTable.updatedAt)],
    });

    return mangas.map((manga) => ({
      id: manga.id,
      slug: manga.slug,
      title: manga.title,
      description: (manga.description || "").slice(0, 100),
      coverImage: manga.coverImage,
      authorName: manga.authorName || "",
      category: manga.category?.name || "",
      tags: manga.mangaTags_mangaId.map((mt: any) => mt.tag_tagId?.name).filter(Boolean).join(", "),
    }));
  },
  ["search-index"],
  { revalidate: 300, tags: ["search-index"] }
);

// Fuse.js runs server-side — client sends query, server returns top 10 results
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim();

    const searchIndex = await getSearchIndex();

    // No query — return empty (client should not fetch without query)
    if (!q || q.length < 2) {
      return NextResponse.json([], {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      });
    }

    // Run Fuse.js on server
    const fuse = new Fuse(searchIndex, {
      keys: [
        { name: "title", weight: 2 },
        { name: "authorName", weight: 1.5 },
        { name: "description", weight: 0.5 },
        { name: "tags", weight: 1 },
        { name: "category", weight: 0.8 },
      ],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 2,
    });

    const results = fuse.search(q, { limit: 10 });

    return NextResponse.json(
      results.map((r) => r.item),
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json(
      { error: "Failed to search" },
      { status: 500 }
    );
  }
}

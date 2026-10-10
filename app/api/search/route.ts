import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { manga as mangaTable } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

import { unstable_cache } from "next/cache";
import { literalSearchPattern } from "@/lib/manga-query";

const getSearchSuggestions = unstable_cache(async (q: string) => {
  const pattern = literalSearchPattern(q);
  const latin = /[a-zA-Z]/.test(q);
  // Include author/contributor matches even when full-text search also has results.
  const textMatch = sql`(${mangaTable.title} ILIKE ${pattern} OR ${mangaTable.authorName} ILIKE ${pattern} OR EXISTS (
    SELECT 1 FROM public.authors pa WHERE pa.id = ${mangaTable.authorId} AND pa.name ILIKE ${pattern}
  ) OR EXISTS (
    SELECT 1 FROM public.manga_contributors mc
    INNER JOIN public.authors ca ON ca.id = mc.author_id
    WHERE mc.manga_id = "manga"."id" AND ca.name ILIKE ${pattern}
  ))`;
  const results = await db.query.manga.findMany({
    where: and(eq(mangaTable.isHidden, false), latin
      ? sql`(${mangaTable.fts} @@ plainto_tsquery('english', ${q}) OR ${textMatch})`
      : textMatch),
    orderBy: latin
      ? sql`ts_rank(${mangaTable.fts}, plainto_tsquery('english', ${q})) DESC, ${mangaTable.title} ASC, ${mangaTable.id} ASC`
      : sql`${mangaTable.title} ASC, ${mangaTable.id} ASC`,
    limit: 10,
    columns: { id: true, slug: true, title: true, coverImage: true, authorName: true },
    with: { category: { columns: { name: true } }, author: { columns: { name: true } } },
  });
  return results.map((manga) => ({
    id: manga.id, slug: manga.slug, title: manga.title, coverImage: manga.coverImage,
    authorName: manga.author?.name || manga.authorName || "", category: manga.category?.name || "",
  }));
}, ["manga-search-v2"], { revalidate: 300, tags: ["manga-list", "authors"] });

export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 2 || q.length > 200) {
      return NextResponse.json([], { status: q && q.length > 200 ? 400 : 200, headers });
    }
    return NextResponse.json(await getSearchSuggestions(q), { headers });
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json({ error: "Failed to search" }, { status: 500, headers });
  }
}

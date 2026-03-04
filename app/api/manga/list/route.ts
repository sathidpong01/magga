import { NextResponse } from "next/server";
import { db } from "@/db";
import { manga as mangaTable, categories as categoriesTable, tags as tagsTable, mangaTags as mangaTagsTable } from "@/db/schema";
import { eq, ilike, and, inArray, desc, asc, count, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

const ITEMS_PER_PAGE = 12;

// Cache the query for 60 seconds
const getMangasWithPagination = unstable_cache(
  async (
    page: number,
    search?: string,
    categoryId?: string,
    tagNames?: string[],
    sort?: string
  ) => {
    const offset = (page - 1) * ITEMS_PER_PAGE;

    // Build Where conditions
    const conditions = [eq(mangaTable.isHidden, false)];

    if (search) {
      conditions.push(ilike(mangaTable.title, `%${search}%`));
    }

    if (categoryId && categoryId !== "all") {
      conditions.push(eq(mangaTable.categoryId, categoryId));
    }

    // Build OrderBy
    let orderByClause;
    if (sort === "updated") {
      orderByClause = desc(mangaTable.updatedAt);
    } else if (sort === "az") {
      orderByClause = asc(mangaTable.title);
    } else {
      orderByClause = desc(mangaTable.createdAt);
    }

    // If tag filter exists, get mangaIds that have those tags
    let filteredMangaIds: string[] | undefined;
    if (tagNames && tagNames.length > 0) {
      const tagsRows = await db
        .select({ id: tagsTable.id })
        .from(tagsTable)
        .where(inArray(tagsTable.name, tagNames));
      const tagIds = tagsRows.map((t) => t.id);

      if (tagIds.length > 0) {
        const mangaTagRows = await db
          .select({ mangaId: mangaTagsTable.mangaId })
          .from(mangaTagsTable)
          .where(inArray(mangaTagsTable.tagId, tagIds));
        filteredMangaIds = [...new Set(mangaTagRows.map((r) => r.mangaId))];
      } else {
        filteredMangaIds = [];
      }
    }

    if (filteredMangaIds !== undefined) {
      if (filteredMangaIds.length === 0) {
        return { mangas: [], total: 0, page, totalPages: 0, hasMore: false };
      }
      conditions.push(inArray(mangaTable.id, filteredMangaIds));
    }

    const whereClause = and(...conditions);

    // Fetch mangas and total in parallel
    const [mangaRows, [{ total }]] = await Promise.all([
      db.query.manga.findMany({
        where: whereClause,
        orderBy: orderByClause,
        offset,
        limit: ITEMS_PER_PAGE,
        columns: {
          id: true,
          slug: true,
          title: true,
          coverImage: true,
          viewCount: true,
          averageRating: true,
        },
        with: {
          category: {
            columns: { name: true },
          },
          mangaTags_mangaId: {
            with: {
              tag_tagId: {
                columns: { id: true, name: true },
              },
            },
          },
        },
      }),
      db.select({ total: count() }).from(mangaTable).where(whereClause),
    ]);

    const mangas = mangaRows.map((m) => ({
      ...m,
      tags: m.mangaTags_mangaId.map((mt: any) => mt.tag_tagId),
    }));

    const totalNum = Number(total);

    return {
      mangas,
      total: totalNum,
      page,
      totalPages: Math.ceil(totalNum / ITEMS_PER_PAGE),
      hasMore: offset + mangas.length < totalNum,
    };
  },
  ["manga-list"],
  { revalidate: 60, tags: ["manga-list"] }
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const search = searchParams.get("search") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const tagsParam = searchParams.get("tags");
    const tagNames = tagsParam ? tagsParam.split(",") : undefined;
    const sort = searchParams.get("sort") || undefined;

    const result = await getMangasWithPagination(
      page,
      search,
      categoryId,
      tagNames,
      sort
    );

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error fetching manga list:", error);
    return NextResponse.json(
      { error: "Failed to fetch manga list" },
      { status: 500 }
    );
  }
}

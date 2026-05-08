import { NextResponse } from "next/server";
import { db } from "@/db";
import { manga as mangaTable, categories as categoriesTable, tags as tagsTable, mangaTags as mangaTagsTable } from "@/db/schema";
import { eq, ilike, and, inArray, desc, asc, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

const DEFAULT_ITEMS_PER_PAGE = 12;
type MangaListRow = {
  id: string;
  slug: string;
  title: string;
  coverImage: string;
  viewCount: number;
  averageRating: number;
  categoryId?: string | null;
  category?: { name: string } | null;
  tags?: Array<{ id: string; name: string }>;
};

// Cache the query for 60 seconds
const getMangasWithPagination = unstable_cache(
  async (
    page: number,
    pageSize: number,
    search?: string,
    categoryId?: string,
    tagNames?: string[],
    sort?: string,
    excludeTagIds?: string[]
  ) => {
    const offset = (page - 1) * pageSize;
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

    // Exclude manga that have any blocked tags
    if (excludeTagIds && excludeTagIds.length > 0) {
      const excludedMangaRows = await db
        .selectDistinct({ mangaId: mangaTagsTable.mangaId })
        .from(mangaTagsTable)
        .where(inArray(mangaTagsTable.tagId, excludeTagIds));
      const excludedMangaIds = excludedMangaRows.map((r) => r.mangaId);
      if (excludedMangaIds.length > 0) {
        conditions.push(sql`${mangaTable.id} NOT IN (${sql.join(excludedMangaIds.map(id => sql`${id}`), sql`, `)})`);
      }
    }

    const whereClause = and(...conditions);

    const mangaRows = await db
      .select({
        id: mangaTable.id,
        slug: mangaTable.slug,
        title: mangaTable.title,
        coverImage: mangaTable.coverImage,
        viewCount: mangaTable.viewCount,
        averageRating: mangaTable.averageRating,
        categoryId: mangaTable.categoryId,
      })
      .from(mangaTable)
      .where(whereClause)
      .orderBy(orderByClause)
      .offset(offset)
      .limit(pageSize + 1);

    const hasMore = mangaRows.length > pageSize;
    const visibleRows = mangaRows.slice(0, pageSize);
    const mangaIds = visibleRows.map((manga) => manga.id);
    const categoryIds = [...new Set(visibleRows.map((manga) => manga.categoryId).filter((id): id is string => Boolean(id)))];

    const [categoryRows, tagRows] = await Promise.all([
      categoryIds.length
        ? db
            .select({ id: categoriesTable.id, name: categoriesTable.name })
            .from(categoriesTable)
            .where(inArray(categoriesTable.id, categoryIds))
        : Promise.resolve([]),
      mangaIds.length
        ? db
            .select({
              mangaId: mangaTagsTable.mangaId,
              id: tagsTable.id,
              name: tagsTable.name,
            })
            .from(mangaTagsTable)
            .innerJoin(tagsTable, eq(tagsTable.id, mangaTagsTable.tagId))
            .where(inArray(mangaTagsTable.mangaId, mangaIds))
        : Promise.resolve([]),
    ]);

    const categoriesById = new Map(categoryRows.map((category) => [category.id, category]));
    const tagsByMangaId = new Map<string, Array<{ id: string; name: string }>>();

    for (const tag of tagRows) {
      const tags = tagsByMangaId.get(tag.mangaId) ?? [];
      tags.push({ id: tag.id, name: tag.name });
      tagsByMangaId.set(tag.mangaId, tags);
    }

    const mangas = visibleRows.map((manga) => ({
      ...manga,
      category: manga.categoryId ? categoriesById.get(manga.categoryId) ?? null : null,
      tags: tagsByMangaId.get(manga.id) ?? [],
    }));
    const total = offset + mangas.length + (hasMore ? 1 : 0);

    return {
      mangas,
      total,
      page,
      totalPages: Math.ceil(total / pageSize),
      hasMore,
    };
  },
  ["manga-list"],
  { revalidate: 60, tags: ["manga-list"] }
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSizeParam = parseInt(
      searchParams.get("pageSize") || String(DEFAULT_ITEMS_PER_PAGE),
      10
    );
    const pageSize = Number.isFinite(pageSizeParam)
      ? Math.min(Math.max(pageSizeParam, 1), 24)
      : DEFAULT_ITEMS_PER_PAGE;
    const search = searchParams.get("search") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const tagsParam = searchParams.get("tags");
    const tagNames = tagsParam ? tagsParam.split(",") : undefined;
    const sort = searchParams.get("sort") || undefined;
    const excludeTagIdsParam = searchParams.get("excludeTagIds");
    const excludeTagIds = excludeTagIdsParam ? excludeTagIdsParam.split(",").filter(Boolean) : undefined;

    const result = await getMangasWithPagination(
      page,
      pageSize,
      search,
      categoryId,
      tagNames,
      sort,
      excludeTagIds
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

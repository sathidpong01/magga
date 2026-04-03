import { NextResponse } from "next/server";
import { db } from "@/db";
import { manga as mangaTable, categories as categoriesTable, tags as tagsTable, mangaTags as mangaTagsTable } from "@/db/schema";
import { eq, ilike, and, inArray, desc, asc, count, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

const DEFAULT_ITEMS_PER_PAGE = 12;
type MangaListRow = {
  id: string;
  slug: string;
  title: string;
  coverImage: string;
  viewCount: number;
  averageRating: number;
  category?: { name: string } | null;
  mangaTags_mangaId?: Array<{
    tag_tagId?: { id: string; name: string } | null;
  }>;
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
    const mapMangas = (rows: MangaListRow[]) =>
      rows.map(({ mangaTags_mangaId, ...m }) => ({
        ...m,
        category: m.category ?? null,
        tags: (mangaTags_mangaId ?? [])
          .map((mt) => mt.tag_tagId)
          .filter((tag): tag is { id: string; name: string } => Boolean(tag)),
      }));

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

    const totalPromise = db.select({ total: count() }).from(mangaTable).where(whereClause);
    let mangaRows: MangaListRow[];
    let totalRows: Array<{ total: number }>;

    try {
      [mangaRows, totalRows] = await Promise.all([
        db.query.manga.findMany({
          where: whereClause,
          orderBy: orderByClause,
          offset,
          limit: pageSize,
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
        totalPromise,
      ]);
    } catch (error) {
      console.error("Manga list relation query failed, falling back to base manga query.", error);
      [mangaRows, totalRows] = await Promise.all([
        db.query.manga.findMany({
          where: whereClause,
          orderBy: orderByClause,
          offset,
          limit: pageSize,
          columns: {
            id: true,
            slug: true,
            title: true,
            coverImage: true,
            viewCount: true,
            averageRating: true,
          },
        }),
        totalPromise,
      ]);
    }

    const [{ total }] = totalRows;
    const mangas = mapMangas(mangaRows);

    const totalNum = Number(total);

    return {
      mangas,
      total: totalNum,
      page,
      totalPages: Math.ceil(totalNum / pageSize),
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

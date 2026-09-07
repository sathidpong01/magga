import "server-only";

import { unstable_cache } from "next/cache";
import { and, asc, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  categories as categoriesTable,
  manga as mangaTable,
  mangaTags as mangaTagsTable,
  tags as tagsTable,
} from "@/db/schema";

export const DEFAULT_MANGA_PAGE_SIZE = 12;

export const getMangasWithPagination = unstable_cache(
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
    const conditions = [eq(mangaTable.isHidden, false)];

    if (search) conditions.push(ilike(mangaTable.title, `%${search}%`));
    if (categoryId && categoryId !== "all") {
      conditions.push(eq(mangaTable.categoryId, categoryId));
    }

    let orderByClause = desc(mangaTable.createdAt);
    if (sort === "updated") orderByClause = desc(mangaTable.updatedAt);
    if (sort === "az") orderByClause = asc(mangaTable.title);

    if (tagNames?.length) {
      const tagRows = await db
        .select({ id: tagsTable.id })
        .from(tagsTable)
        .where(inArray(tagsTable.name, tagNames));
      const tagIds = tagRows.map((tag) => tag.id);

      if (!tagIds.length) {
        return { mangas: [], total: 0, page, totalPages: 0, hasMore: false };
      }

      const mangaTagRows = await db
        .selectDistinct({ mangaId: mangaTagsTable.mangaId })
        .from(mangaTagsTable)
        .where(inArray(mangaTagsTable.tagId, tagIds));
      const filteredMangaIds = mangaTagRows.map((row) => row.mangaId);

      if (!filteredMangaIds.length) {
        return { mangas: [], total: 0, page, totalPages: 0, hasMore: false };
      }
      conditions.push(inArray(mangaTable.id, filteredMangaIds));
    }

    if (excludeTagIds?.length) {
      const excludedMangaRows = await db
        .selectDistinct({ mangaId: mangaTagsTable.mangaId })
        .from(mangaTagsTable)
        .where(inArray(mangaTagsTable.tagId, excludeTagIds));
      const excludedMangaIds = excludedMangaRows.map((row) => row.mangaId);

      if (excludedMangaIds.length) {
        conditions.push(
          sql`${mangaTable.id} NOT IN (${sql.join(
            excludedMangaIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        );
      }
    }

    const rows = await db
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
      .where(and(...conditions))
      .orderBy(orderByClause)
      .offset(offset)
      .limit(pageSize + 1);

    const hasMore = rows.length > pageSize;
    const visibleRows = rows.slice(0, pageSize);
    const mangaIds = visibleRows.map((manga) => manga.id);
    const categoryIds = [
      ...new Set(
        visibleRows
          .map((manga) => manga.categoryId)
          .filter((id): id is string => Boolean(id))
      ),
    ];

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
      const mangaTags = tagsByMangaId.get(tag.mangaId) ?? [];
      mangaTags.push({ id: tag.id, name: tag.name });
      tagsByMangaId.set(tag.mangaId, mangaTags);
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

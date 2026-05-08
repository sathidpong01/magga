import { db } from "@/db";
import {
  categories as categoriesTable,
  manga as mangaTable,
  mangaTags as mangaTagsTable,
  tags as tagsTable,
} from "@/db/schema";
import { eq, ilike, asc, desc, and, SQL, inArray } from "drizzle-orm";
import InfiniteMangaGrid from "./InfiniteMangaGrid";

interface Ad {
  id: string;
  type: string;
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
  content?: string | null;
  repeatCount?: number;
}

interface StreamingMangaGridProps {
  search?: string;
  categoryId?: string;
  tagNames?: string[];
  sort?: string;
  ads: Ad[];
  pageSize?: number;
}

type MangaGridRow = {
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

/**
 * Async Server Component for streaming manga grid
 * This component fetches data on the server and streams it to the client
 */
export default async function StreamingMangaGrid({
  search,
  categoryId,
  tagNames,
  sort,
  ads,
  pageSize = 12,
}: StreamingMangaGridProps) {
  // Build where conditions
  const conditions: SQL[] = [eq(mangaTable.isHidden, false)];

  if (search) {
    conditions.push(ilike(mangaTable.title, `%${search}%`));
  }

  if (categoryId && categoryId !== "all") {
    conditions.push(eq(mangaTable.categoryId, categoryId));
  }

  // For tags, need subquery: find manga IDs that have any of the given tags
  let mangaIdsWithTags: string[] | undefined;
  if (tagNames && tagNames.length > 0) {
    const tagRows = await db.select({ id: tagsTable.id })
      .from(tagsTable)
      .where(inArray(tagsTable.name, tagNames));
    const tagIds = tagRows.map(t => t.id);
    if (tagIds.length > 0) {
      const mangaTagRows = await db.selectDistinct({ mangaId: mangaTagsTable.mangaId })
        .from(mangaTagsTable)
        .where(inArray(mangaTagsTable.tagId, tagIds));
      mangaIdsWithTags = mangaTagRows.map(r => r.mangaId);
      conditions.push(inArray(mangaTable.id, mangaIdsWithTags.length > 0 ? mangaIdsWithTags : ["none"]));
    }
  }

  const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];
  // Build orderBy
  let orderByClause = desc(mangaTable.createdAt);
  if (sort === "updated") {
    orderByClause = desc(mangaTable.updatedAt);
  } else if (sort === "az") {
    orderByClause = asc(mangaTable.title);
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
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(pageSize + 1);

  const hasMore = rows.length > pageSize;
  const visibleRows = rows.slice(0, pageSize);
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

  return (
    <InfiniteMangaGrid
      initialMangas={mangas as any}
      initialHasMore={hasMore}
      ads={ads}
      pageSize={pageSize}
      search={search}
      categoryId={categoryId}
      tags={(tagNames ?? []).join(",")}
      sort={sort}
    />
  );
}

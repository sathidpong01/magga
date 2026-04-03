import { db } from "@/db";
import { manga as mangaTable, mangaTags as mangaTagsTable, tags as tagsTable } from "@/db/schema";
import { eq, ilike, asc, desc, and, SQL, inArray, count } from "drizzle-orm";
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
  category?: { name: string } | null;
  mangaTags_mangaId?: Array<{
    tag_tagId?: { id: string; name: string } | null;
  }>;
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
  const mapMangas = (rows: MangaGridRow[]) =>
    rows.map(({ mangaTags_mangaId, ...m }) => ({
      ...m,
      category: m.category ?? null,
      tags: (mangaTags_mangaId ?? [])
        .map((mt) => mt.tag_tagId)
        .filter((tag): tag is { id: string; name: string } => Boolean(tag)),
    }));

  // Build orderBy
  let orderByClause = desc(mangaTable.createdAt);
  if (sort === "updated") {
    orderByClause = desc(mangaTable.updatedAt);
  } else if (sort === "az") {
    orderByClause = asc(mangaTable.title);
  }

  const totalPromise = db.select({ count: count() }).from(mangaTable).where(whereClause);
  let mangasQuery: MangaGridRow[];
  let totalResult: Array<{ count: number }>;

  try {
    [mangasQuery, totalResult] = await Promise.all([
      db.query.manga.findMany({
        where: whereClause,
        orderBy: [orderByClause],
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
    console.error("StreamingMangaGrid relation query failed, falling back to base manga query.", error);
    [mangasQuery, totalResult] = await Promise.all([
      db.query.manga.findMany({
        where: whereClause,
        orderBy: [orderByClause],
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

  const total = totalResult[0]?.count ?? 0;
  const mangas = mapMangas(mangasQuery);

  const hasMore = mangas.length < total;

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

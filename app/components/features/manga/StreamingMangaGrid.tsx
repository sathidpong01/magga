import { db } from "@/db";
import { manga as mangaTable, _mangaTags, tags as tagsTable } from "@/db/schema";
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
}

const ITEMS_PER_PAGE = 12;

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
      const mangaTagRows = await db.selectDistinct({ mangaId: _mangaTags.a })
        .from(_mangaTags)
        .where(inArray(_mangaTags.b, tagIds));
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

  // Fetch mangas and total count in parallel
  const [mangasQuery, totalResult] = await Promise.all([
    db.query.manga.findMany({
      where: whereClause,
      orderBy: [orderByClause],
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
    db.select({ count: db.$count(mangaTable, whereClause) }).from(mangaTable),
  ]);

  const total = totalResult[0]?.count ?? 0;

  const mangas = mangasQuery.map(m => ({
    ...m,
    tags: m.mangaTags_mangaId.map((mt: any) => mt.tag_tagId),
  }));

  const hasMore = mangas.length < total;

  return (
    <InfiniteMangaGrid
      initialMangas={mangas as any}
      initialHasMore={hasMore}
      ads={ads}
      search={search}
      categoryId={categoryId}
      tags={(tagNames ?? []).join(",")}
      sort={sort}
    />
  );
}

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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
  where: Prisma.MangaWhereInput;
  orderBy: Prisma.MangaOrderByWithRelationInput;
  ads: Ad[];
  search?: string;
  categoryId?: string;
  tags?: string;
  sort?: string;
}

const ITEMS_PER_PAGE = 12;

/**
 * Async Server Component for streaming manga grid
 * This component fetches data on the server and streams it to the client
 */
export default async function StreamingMangaGrid({
  where,
  orderBy,
  ads,
  search,
  categoryId,
  tags,
  sort,
}: StreamingMangaGridProps) {
  // Fetch mangas and total count in parallel
  const [mangas, total] = await Promise.all([
    prisma.manga.findMany({
      where,
      orderBy,
      take: ITEMS_PER_PAGE,
      select: {
        id: true,
        slug: true,
        title: true,
        coverImage: true,
        viewCount: true,
        averageRating: true,
        category: {
          select: { name: true },
        },
        tags: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.manga.count({ where }),
  ]);

  const hasMore = mangas.length < total;

  return (
    <InfiniteMangaGrid
      initialMangas={mangas}
      initialHasMore={hasMore}
      ads={ads}
      search={search}
      categoryId={categoryId}
      tags={tags}
      sort={sort}
    />
  );
}

import { getMangasWithPagination } from "@/lib/manga-list";
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

export default async function StreamingMangaGrid({
  search,
  categoryId,
  tagNames,
  sort,
  ads,
  pageSize = 12,
}: StreamingMangaGridProps) {
  const { mangas, hasMore } = await getMangasWithPagination(
    1,
    pageSize,
    search,
    categoryId,
    tagNames,
    sort
  );

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

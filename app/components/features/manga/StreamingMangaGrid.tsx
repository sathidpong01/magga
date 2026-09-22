import { getMangasWithPagination } from "@/lib/manga-list";
import InfiniteMangaGrid from "./InfiniteMangaGrid";
import ErrorFallback from "@/app/components/ui/ErrorFallback";

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
  author?: string;
  ads: Ad[];
  pageSize?: number;
}

export default async function StreamingMangaGrid({
  search,
  categoryId,
  tagNames,
  sort,
  author,
  ads,
  pageSize = 12,
}: StreamingMangaGridProps) {
  let result: Awaited<ReturnType<typeof getMangasWithPagination>> | null = null;

  try {
    result = await getMangasWithPagination(
      1,
      pageSize,
      search,
      categoryId,
      tagNames,
      sort,
      undefined,
      author
    );
  } catch (error) {
    console.error("StreamingMangaGrid: initial fetch failed, retrying once...", error);
    try {
      // Retry once after 500ms on transient connection / timeout error
      await new Promise((resolve) => setTimeout(resolve, 500));
      result = await getMangasWithPagination(
        1,
        pageSize,
        search,
        categoryId,
        tagNames,
        sort,
        undefined,
        author
      );
    } catch (retryError) {
      console.error("StreamingMangaGrid: retry failed:", retryError);
    }
  }

  if (!result) {
    return (
      <ErrorFallback
        title="เกิดข้อผิดพลาดในการโหลดรายการมังงะ"
        description="ไม่สามารถเชื่อมต่อฐานข้อมูลได้ในขณะนี้ กรุณารีเฟรชหน้าเว็บหรือลองใหม่อีกครั้ง"
      />
    );
  }

  return (
    <InfiniteMangaGrid
      initialMangas={result.mangas as any}
      initialHasMore={result.hasMore}
      ads={ads}
      pageSize={pageSize}
      search={search}
      categoryId={categoryId}
      tags={(tagNames ?? []).join(",")}
      sort={sort}
      author={author}
    />
  );
}

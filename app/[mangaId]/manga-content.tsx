"use client";

import { Suspense } from "react";
import MangaReader from "@/app/components/features/comments/MangaReader";
import { MangaReaderSkeleton } from "./loading-skeletons";
import type { MangaPageRecord } from "@/lib/manga-pages";

interface MangaContentProps {
  mangaId: string;
  mangaTitle: string;
  pages: MangaPageRecord[];
}

export function SuspendedMangaReader({
  mangaId,
  mangaTitle,
  pages,
}: MangaContentProps) {
  return (
    <Suspense fallback={<MangaReaderSkeleton />}>
      <MangaReader mangaId={mangaId} mangaTitle={mangaTitle} pages={pages} />
    </Suspense>
  );
}

// NOTE: SuspendedCommentSection has been replaced by ServerCommentSection
// which is now imported directly in page.tsx for better performance

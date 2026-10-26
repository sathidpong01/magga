"use client";

import { Suspense } from "react";
import MangaReader from "@/app/components/features/comments/MangaReader";
import { MangaReaderSkeleton } from "./loading-skeletons";
import type { MangaPageRecord } from "@/lib/manga-pages";

interface MangaContentProps {
  mangaId: string;
  mangaTitle: string;
  mangaSlug: string;
  remember?: boolean;
  pages: MangaPageRecord[];
}

export function SuspendedMangaReader({
  mangaId,
  mangaTitle,
  mangaSlug,
  remember = true,
  pages,
}: MangaContentProps) {
  return (
    <Suspense fallback={<MangaReaderSkeleton pages={pages} />}>
      <MangaReader
        mangaId={mangaId}
        mangaTitle={mangaTitle}
        mangaSlug={mangaSlug}
        remember={remember}
        pages={pages}
      />
    </Suspense>
  );
}

// NOTE: SuspendedCommentSection has been replaced by ServerCommentSection
// which is now imported directly in page.tsx for better performance

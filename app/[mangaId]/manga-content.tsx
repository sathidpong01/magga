"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { MangaReaderSkeleton } from "./loading-skeletons";
import type { MangaPageRecord } from "@/lib/manga-pages";

// Keep the reader client-rendered so a large image list cannot hold the server
// response stream open when the runtime or database is under pressure.
const MangaReader = dynamic(
  () => import("@/app/components/features/comments/MangaReader"),
  {
    ssr: false,
    loading: () => <MangaReaderSkeleton />,
  }
);

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

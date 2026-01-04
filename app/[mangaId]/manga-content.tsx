"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { MangaReaderSkeleton } from "./loading-skeletons";

// Dynamic import WITH SSR enabled for better FCP/LCP
// The component will render on server first, then hydrate on client
const MangaReader = dynamic(
  () => import("@/app/components/features/comments/MangaReader"),
  {
    loading: () => <MangaReaderSkeleton />,
  }
);

interface MangaContentProps {
  mangaId: string;
  mangaTitle: string;
  pages: string[];
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

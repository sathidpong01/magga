"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { MangaReaderSkeleton, CommentSectionSkeleton } from "./loading-skeletons";

// Dynamic imports with no SSR for heavy components
const MangaReader = dynamic(
  () => import("@/app/components/features/comments/MangaReader"),
  { 
    ssr: false,
    loading: () => <MangaReaderSkeleton />,
  }
);

const MangaCommentSection = dynamic(
  () => import("@/app/components/features/comments/MangaComments").then(mod => ({ default: mod.MangaCommentSection })),
  { 
    ssr: false,
    loading: () => <CommentSectionSkeleton />,
  }
);

interface MangaContentProps {
  mangaId: string;
  mangaTitle: string;
  pages: string[];
}

export function SuspendedMangaReader({ mangaId, mangaTitle, pages }: MangaContentProps) {
  return (
    <Suspense fallback={<MangaReaderSkeleton />}>
      <MangaReader mangaId={mangaId} mangaTitle={mangaTitle} pages={pages} />
    </Suspense>
  );
}

interface CommentProps {
  mangaId: string;
}

export function SuspendedCommentSection({ mangaId }: CommentProps) {
  return (
    <Suspense fallback={<CommentSectionSkeleton />}>
      <MangaCommentSection mangaId={mangaId} />
    </Suspense>
  );
}

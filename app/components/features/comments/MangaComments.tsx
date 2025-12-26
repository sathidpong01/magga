"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { CircularProgress, Box } from "@mui/material";

// Dynamic import to avoid SSR issues with emoji-mart
const CommentSection = dynamic(
  () => import("@/app/components/features/comments/CommentSection"),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={32} />
      </Box>
    ),
  }
);

const ImageCommentPanel = dynamic(
  () => import("@/app/components/features/comments/ImageCommentPanel"),
  {
    ssr: false,
    loading: () => null,
  }
);

interface MangaCommentsProps {
  mangaId: string;
}

export function MangaCommentSection({ mangaId }: MangaCommentsProps) {
  return <CommentSection mangaId={mangaId} title="ความคิดเห็น" />;
}

interface MangaImageCommentsProps {
  mangaId: string;
  totalPages: number;
  imageRefs: React.RefObject<(HTMLDivElement | null)[]>;
}

// Component นี้จะติดตามว่ารูปไหนอยู่ในหน้าจอ
export function MangaImageComments({
  mangaId,
  totalPages,
  imageRefs,
}: MangaImageCommentsProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const currentPageRef = useRef(currentPage);

  // Keep ref in sync with state
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    if (!imageRefs.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // หารูปที่อยู่ในหน้าจอมากที่สุด
        let maxRatio = 0;
        let visibleIndex = currentPageRef.current;

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            const index = imageRefs.current?.indexOf(
              entry.target as HTMLDivElement
            );
            if (index !== undefined && index !== -1) {
              maxRatio = entry.intersectionRatio;
              visibleIndex = index;
            }
          }
        });

        if (maxRatio > 0 && visibleIndex !== currentPageRef.current) {
          setCurrentPage(visibleIndex);
        }
      },
      {
        threshold: [0.1, 0.3, 0.5, 0.7],
        rootMargin: "-20% 0px -20% 0px", // Focus on center of screen
      }
    );

    // Observe all images
    imageRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [imageRefs]);

  return (
    <ImageCommentPanel
      mangaId={mangaId}
      imageIndex={currentPage}
      totalPages={totalPages}
    />
  );
}

// Legacy export for mobile button (per-image)
interface ImageCommentProps {
  mangaId: string;
  imageIndex: number;
  pageLabel?: string;
}

export function MangaImageCommentButton({
  mangaId,
  imageIndex,
  pageLabel,
}: ImageCommentProps) {
  // This is now only used for mobile
  return null; // Desktop uses MangaImageComments instead
}

"use client";

import { Box, Skeleton } from "@mui/material";
import { maggaColors, maggaLayout } from "@/lib/design-tokens";
import type { MangaPageRecord } from "@/lib/manga-pages";
import CommentSectionPlaceholder from "@/app/components/features/comments/CommentSectionPlaceholder";

export function MangaReaderSkeleton({ pages }: { pages?: MangaPageRecord[] }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: maggaLayout.reader.gap,
      }}
    >
      {(pages?.length ? pages : [undefined, undefined, undefined]).map((page, index) => <Skeleton
        key={index}
        variant="rectangular"
        sx={{
          width: "100%",
          maxWidth: maggaLayout.reader.maxWidth,
          height: "auto",
          aspectRatio: page?.width && page?.height ? `${page.width} / ${page.height}` : maggaLayout.reader.aspectRatio,
          bgcolor: maggaColors.surface,
        }}
      />)}
    </Box>
  );
}

export function CommentSectionSkeleton() {
  return <CommentSectionPlaceholder />;
}

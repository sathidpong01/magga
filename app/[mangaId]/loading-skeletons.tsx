"use client";

import { Box, Skeleton } from "@mui/material";
import { maggaColors, maggaLayout } from "@/lib/design-tokens";
import type { MangaPageRecord } from "@/lib/manga-pages";

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
      {(pages?.length ? pages.slice(0, 3) : [undefined, undefined, undefined]).map((page, index) => <Skeleton
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
  return (
    <Box sx={{ mt: 4 }}>
      {/* Comment box skeleton */}
      <Skeleton
        variant="rectangular"
        sx={{
          width: "100%",
          height: 80,
          borderRadius: 0.5,
          bgcolor: "rgba(255,255,255,0.08)",
          mb: 2,
        }}
      />
      {/* Comment items skeleton */}
      {[1, 2, 3].map((i) => (
        <Box key={i} sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
          <Skeleton
            variant="circular"
            width={40}
            height={40}
            sx={{ bgcolor: "rgba(255,255,255,0.08)" }}
          />
          <Box sx={{ flex: 1 }}>
            <Skeleton
              variant="text"
              width="30%"
              sx={{ bgcolor: "rgba(255,255,255,0.08)" }}
            />
            <Skeleton
              variant="text"
              width="80%"
              sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

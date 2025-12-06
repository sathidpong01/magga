"use client";

import { Box, Skeleton } from "@mui/material";

export function MangaReaderSkeleton() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
      {/* First page skeleton - visible immediately */}
      <Skeleton
        variant="rectangular"
        sx={{
          width: "100%",
          maxWidth: "1000px",
          height: { xs: 400, md: 600 },
          borderRadius: 0.5,
          bgcolor: "rgba(255,255,255,0.08)",
        }}
      />
      {/* Second page hint */}
      <Skeleton
        variant="rectangular"
        sx={{
          width: "100%",
          maxWidth: "1000px",
          height: 100,
          borderRadius: 0.5,
          bgcolor: "rgba(255,255,255,0.05)",
        }}
      />
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
          <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: "rgba(255,255,255,0.08)" }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="30%" sx={{ bgcolor: "rgba(255,255,255,0.08)" }} />
            <Skeleton variant="text" width="80%" sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

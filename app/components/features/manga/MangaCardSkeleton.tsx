import { Skeleton, Box } from "@mui/material";
import { maggaColors } from "@/lib/design-tokens";

export default function MangaCardSkeleton() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* 3:4 Cover Skeleton */}
      <Box
        sx={{
          aspectRatio: "3/4",
          position: "relative",
          borderRadius: "10px",
          overflow: "hidden",
          bgcolor: maggaColors.surface,
          border: "1px solid",
          borderColor: maggaColors.border,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
          sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }}
        />
        {/* Category Chip Skeleton on top right */}
        <Skeleton
          variant="rounded"
          width={56}
          height={28}
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            borderRadius: "6px",
            bgcolor: "rgba(255, 255, 255, 0.08)",
          }}
        />
      </Box>

      {/* Details Below Cover Skeleton */}
      <Box sx={{ pt: 1, px: 0.25, pb: 0.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
        {/* Title Lines */}
        <Skeleton
          variant="text"
          width="90%"
          height={20}
          sx={{ bgcolor: "rgba(255, 255, 255, 0.08)" }}
        />
        <Skeleton
          variant="text"
          width="60%"
          height={20}
          sx={{ bgcolor: "rgba(255, 255, 255, 0.06)" }}
        />

        {/* Stats Skeleton */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25 }}>
          <Skeleton
            variant="text"
            width={35}
            height={16}
            sx={{ bgcolor: "rgba(217, 119, 6, 0.15)" }}
          />
          <Skeleton
            variant="text"
            width={45}
            height={16}
            sx={{ bgcolor: "rgba(255, 255, 255, 0.06)" }}
          />
        </Box>
      </Box>
    </Box>
  );
}

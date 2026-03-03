"use client";

import { Box, Typography } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import StarIcon from "@mui/icons-material/Star";

interface MangaViewRatingProps {
  mangaId: string;
  initialViewCount: number;
  initialAverageRating: number;
  initialRatingCount: number;
  hideViewCount?: boolean;
}

export default function MangaViewRating({
  initialViewCount,
  initialAverageRating,
  initialRatingCount,
  hideViewCount = false,
}: MangaViewRatingProps) {
  return (
    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
      {!hideViewCount && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}>
          <VisibilityIcon fontSize="small" />
          <Typography variant="body2">{initialViewCount.toLocaleString()}</Typography>
        </Box>
      )}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "warning.main" }}>
        <StarIcon fontSize="small" />
        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
          {initialAverageRating > 0 ? initialAverageRating.toFixed(1) : "N/A"}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", ml: 0.5 }}>
          ({initialRatingCount})
        </Typography>
      </Box>
    </Box>
  );
}

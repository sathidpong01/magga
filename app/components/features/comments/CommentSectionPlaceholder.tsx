"use client";

import { Box, Skeleton } from "@mui/material";
import { maggaColors, maggaRadii } from "@/lib/design-tokens";

// Match the initial guest form, including wrapped controls on narrow phones.
export const commentSectionSx = {
  minHeight: 584,
  "@media (max-width:359.95px)": { minHeight: 684 },
} as const;

export default function CommentSectionPlaceholder() {
  return (
    <Box aria-label="กำลังโหลดความคิดเห็น" role="status" sx={commentSectionSx}>
      <Skeleton variant="rectangular" animation={false} width="55%" height={42} sx={{ mb: 3, bgcolor: maggaColors.surface }} />
      <Box sx={{ display: "flex", gap: 1.5 }}>
        <Skeleton variant="circular" animation={false} width={40} height={40} sx={{ display: { xs: "none", sm: "block" }, flexShrink: 0 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Skeleton variant="rectangular" animation={false} height={44} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" animation={false} height={44} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" animation={false} height={220} sx={{ borderRadius: `${maggaRadii.md}px`, bgcolor: maggaColors.surface }} />
          <Skeleton variant="rectangular" animation={false} height={42} sx={{ mt: 1 }} />
        </Box>
      </Box>
    </Box>
  );
}

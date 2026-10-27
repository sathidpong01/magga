import { maggaColors, maggaRadii } from "@/lib/design-tokens";
import { dashboardInsetSurfaceSx } from "./system";

export const overviewCoverSx = {
  position: "relative", width: "100%",
  maxWidth: { xs: 240, sm: "100%", lg: "clamp(120px, calc(75dvh - 345px), 270px)" },
  mx: "auto", aspectRatio: "3 / 4", overflow: "hidden",
  borderRadius: `${maggaRadii.card}px`, bgcolor: maggaColors.background,
} as const;
export const overviewCardSx = { ...dashboardInsetSurfaceSx, p: 1, borderRadius: `${maggaRadii.card}px`, minWidth: 0 };
export const overviewRankSx = { ...dashboardInsetSurfaceSx, display: "flex", alignItems: "center", gap: 1, px: 1, py: 0.25, minHeight: 56, borderRadius: 1 };

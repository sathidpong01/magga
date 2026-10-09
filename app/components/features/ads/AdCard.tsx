"use client";

import { Box, Paper } from "@mui/material";
import { useAdTracking } from "./useAdTracking";
import { advertisementNavigation } from "./adNavigation";
import { maggaColors } from "@/lib/design-tokens";

interface AdCardProps {
  ad: {
    id: string;
    type: string;
    title: string;
    imageUrl: string;
    linkUrl?: string | null;
    linkUrls?: string[] | null;
    content?: string | null;
  };
}

export default function AdCard({ ad }: AdCardProps) {
  const tracking = useAdTracking(ad.id);
  const navigation = advertisementNavigation(ad, tracking.onClick);
  const imageAlt = ad.title ? `โฆษณา: ${ad.title}` : "โฆษณา";
  const content = (
    <Box
      component="img"
      src={ad.imageUrl}
      ref={tracking.imageRef}
      onLoad={tracking.onLoad}
      loading="lazy"
      decoding="async"
      alt={imageAlt}
      sx={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
      }}
    />
  );

  const surfaceSx = {
    aspectRatio: "2/3",
    position: "relative",
    borderRadius: 1,
    overflow: "hidden",
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": navigation.href
      ? {
          transform: "translateY(-4px)",
        }
      : {},
    "&:focus-visible": navigation.href
      ? { outline: `2px solid ${maggaColors.archiveGoldHover}`, outlineOffset: 2 }
      : {},
    bgcolor: "#171717",
    border: "1px solid rgba(255,255,255,0.05)",
    cursor: navigation.href ? "pointer" : "default",
    display: "block",
  };

  return navigation.href ? (
    <Paper
      component="a"
      {...navigation}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`เปิดโฆษณา: ${ad.title || ad.id}`}
      sx={surfaceSx}
    >
      {content}
    </Paper>
  ) : (
    <Paper sx={surfaceSx}>{content}</Paper>
  );
}

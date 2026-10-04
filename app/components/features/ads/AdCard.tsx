"use client";

import { Box, Paper } from "@mui/material";
import { useAdTracking } from "./useAdTracking";

interface AdCardProps {
  ad: {
    id: string;
    type: string;
    title: string;
    imageUrl: string;
    linkUrl?: string | null;
    content?: string | null;
  };
}

export default function AdCard({ ad }: AdCardProps) {
  const tracking = useAdTracking(ad.id);
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
    "&:hover": ad.linkUrl
      ? {
          transform: "translateY(-4px)",
        }
      : {},
    "&:focus-visible": ad.linkUrl
      ? { outline: "2px solid #fbbf24", outlineOffset: 2 }
      : {},
    bgcolor: "#171717",
    border: "1px solid rgba(255,255,255,0.05)",
    cursor: ad.linkUrl ? "pointer" : "default",
    display: "block",
  };

  return ad.linkUrl ? (
    <Paper
      component="a"
      href={ad.linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`เปิดโฆษณา: ${ad.title || ad.id}`}
      onClick={tracking.onClick}
      sx={surfaceSx}
    >
      {content}
    </Paper>
  ) : (
    <Paper sx={surfaceSx}>{content}</Paper>
  );
}

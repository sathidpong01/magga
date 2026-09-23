"use client";

import { Box, Paper } from "@mui/material";
import { maggaRadii } from "@/lib/design-tokens";

interface AdBannerProps {
  fillArea?: boolean;
  ad: {
    id: string;
    type: string;
    title: string;
    imageUrl: string;
    linkUrl?: string | null;
    content?: string | null;
  };
}

export default function AdBanner({ ad, fillArea = false }: AdBannerProps) {
  const imageAlt = ad.title ? `โฆษณา: ${ad.title}` : "โฆษณา";
  const content = (
    <Box
      component="img"
      src={ad.imageUrl}
      alt={imageAlt}
      sx={{
        position: fillArea ? "absolute" : undefined,
        inset: fillArea ? 0 : undefined,
        width: "100%",
        height: fillArea ? "100%" : "auto",
        display: "block",
        maxHeight: fillArea ? undefined : 150,
        objectFit: fillArea ? "cover" : "contain",
      }}
    />
  );

  const surfaceSx = {
    bgcolor: "transparent",
    ...(fillArea
      ? {
          borderRadius: maggaRadii.card,
          position: "relative" as const,
          display: "block" as const,
          width: "100%",
          aspectRatio: "3 / 1",
        }
      : { borderRadius: 1 }),
    overflow: "hidden",
    cursor: ad.linkUrl ? "pointer" : "default",
    transition: "opacity 0.2s ease, outline-color 0.2s ease",
    "&:hover": ad.linkUrl ? { opacity: 0.9 } : {},
    "&:focus-visible": ad.linkUrl
      ? { outline: "2px solid #fbbf24", outlineOffset: 2 }
      : {},
    boxShadow: "none",
  };

  return ad.linkUrl ? (
    <Paper
      component="a"
      href={ad.linkUrl}
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

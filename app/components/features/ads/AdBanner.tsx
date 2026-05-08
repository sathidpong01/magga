"use client";

import { Box, Paper } from "@mui/material";

interface AdBannerProps {
  ad: {
    id: string;
    type: string;
    title: string;
    imageUrl: string;
    linkUrl?: string | null;
    content?: string | null;
  };
}

export default function AdBanner({ ad }: AdBannerProps) {
  const imageAlt = ad.title ? `โฆษณา: ${ad.title}` : "โฆษณา";
  const content = (
    <Box
      component="img"
      src={ad.imageUrl}
      alt={imageAlt}
      sx={{
        width: "100%",
        height: "auto",
        display: "block",
        maxHeight: 150,
        objectFit: "contain",
      }}
    />
  );

  const surfaceSx = {
    bgcolor: "transparent",
    borderRadius: 1,
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

"use client";

import { Box, Paper } from "@mui/material";
import { useAdTracking } from "./useAdTracking";
import { adDeviceDisplay } from "@/lib/advertisements";

interface AdBannerProps {
  fillArea?: boolean;
  priority?: boolean;
  ad: {
    id: string;
    type: string;
    title: string;
    imageUrl: string;
    linkUrl?: string | null;
    content?: string | null;
    targetDevice?: string;
  };
}

export default function AdBanner({ ad, fillArea = false, priority = false }: AdBannerProps) {
  const tracking = useAdTracking(ad.id);
  const imageAlt = ad.title ? `โฆษณา: ${ad.title}` : "โฆษณา";
  const content = (
    <Box
      component="img"
      src={ad.imageUrl}
      ref={tracking.imageRef}
      onLoad={tracking.onLoad}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      alt={imageAlt}
      sx={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
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
          borderRadius: 0,
          position: "relative" as const,
          display: "block" as const,
          width: "100%",
          aspectRatio: "3 / 1",
        }
      : { borderRadius: 1, position: "relative" as const, width: "100%", height: { xs: 100, md: 150 } }),
    display: adDeviceDisplay(ad.targetDevice),
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
      onClick={tracking.onClick}
      sx={surfaceSx}
    >
      {content}
    </Paper>
  ) : (
    <Paper sx={surfaceSx}>{content}</Paper>
  );
}

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
  const handleClick = () => {
    if (ad.linkUrl) {
      window.open(ad.linkUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Paper
      sx={{
        bgcolor: "transparent",
        borderRadius: 1,
        overflow: "hidden",
        cursor: ad.linkUrl ? "pointer" : "default",
        transition: "all 0.2s",
        "&:hover": ad.linkUrl ? { opacity: 0.9 } : {},
        boxShadow: "none",
      }}
      onClick={handleClick}
    >
      {/* Auto-ratio horizontal banner */}
      <Box
        component="img"
        src={ad.imageUrl}
        alt=""
        sx={{
          width: "100%",
          height: "auto",
          display: "block",
          maxHeight: 150,
          objectFit: "contain",
        }}
      />
    </Paper>
  );
}

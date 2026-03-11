"use client";

import { Box, Paper } from "@mui/material";

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
  const handleClick = () => {
    if (ad.linkUrl) {
      window.open(ad.linkUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Paper
      onClick={handleClick}
      sx={{
        aspectRatio: "2/3",
        position: "relative",
        borderRadius: 1,
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-4px)",
        },
        bgcolor: "#171717",
        border: "1px solid rgba(255,255,255,0.05)",
        cursor: ad.linkUrl ? "pointer" : "default",
      }}
    >
      {/* เหมือน MangaCard: รูปเต็มพื้นที่ */}
      <Box
        component="img"
        src={ad.imageUrl}
        alt=""
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </Paper>
  );
}

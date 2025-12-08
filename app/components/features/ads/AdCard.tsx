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
        height: 400, // เท่ากับ MangaCard
        position: "relative",
        borderRadius: 1,
        overflow: "hidden",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
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
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </Paper>
  );
}

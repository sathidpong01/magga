"use client";

import { useState, useEffect } from "react";
import { Box, IconButton, Paper } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface FloatingAdProps {
  ad: {
    id: string;
    type: string;
    title: string;
    imageUrl: string;
    linkUrl?: string | null;
    content?: string | null;
  };
}

export default function FloatingAd({ ad }: FloatingAdProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem(`ad_dismissed_${ad.id}`);
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show after 2 seconds
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [ad.id]);

  const handleDismiss = () => {
    sessionStorage.setItem(`ad_dismissed_${ad.id}`, "true");
    setIsVisible(false);
    setIsDismissed(true);
  };

  const handleClick = () => {
    if (ad.linkUrl) {
      window.open(ad.linkUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (isDismissed || !isVisible) return null;

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 20,
        right: 20,
        maxWidth: 200,
        bgcolor: "#171717",
        borderRadius: 1,
        overflow: "hidden",
        boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.1)",
        zIndex: 1000,
        animation: "slideIn 0.3s ease-out",
        "@keyframes slideIn": {
          from: { transform: "translateY(100%)", opacity: 0 },
          to: { transform: "translateY(0)", opacity: 1 },
        },
      }}
    >
      <IconButton
        onClick={handleDismiss}
        size="small"
        sx={{
          position: "absolute",
          top: 4,
          right: 4,
          zIndex: 1,
          bgcolor: "rgba(0,0,0,0.5)",
          color: "white",
          "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
        }}
        aria-label="ปิด"
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      <Box 
        onClick={handleClick} 
        sx={{ cursor: ad.linkUrl ? "pointer" : "default" }}
      >
        {/* Auto-ratio vertical image */}
        <Box
          component="img"
          src={ad.imageUrl}
          alt=""
          sx={{
            width: "100%",
            height: "auto",
            display: "block",
          }}
        />
      </Box>
    </Paper>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Box, Typography, LinearProgress } from "@mui/material";

interface ReadingProgressProps {
  currentPage: number;
  totalPages: number;
}

export default function ReadingProgress({
  currentPage,
  totalPages,
}: ReadingProgressProps) {
  const [isVisible, setIsVisible] = useState(false);
  const progress = totalPages > 0 ? ((currentPage + 1) / totalPages) * 100 : 0;

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleScroll = () => {
      setIsVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsVisible(false), 2000);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        bgcolor: "rgba(10, 10, 10, 0.95)",
        backdropFilter: "blur(8px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        transform: isVisible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s ease-in-out",
        py: 0.75,
        px: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: 1000,
          mx: "auto",
        }}
      >
        <Typography variant="caption" sx={{ color: "#fbbf24", fontWeight: 600 }}>
          หน้า {currentPage + 1}/{totalPages}
        </Typography>
        <Box sx={{ flex: 1, mx: 2, maxWidth: 200 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.1)",
              "& .MuiLinearProgress-bar": {
                bgcolor: "#fbbf24",
                borderRadius: 2,
              },
            }}
          />
        </Box>
        <Typography variant="caption" color="text.secondary">
          {Math.round(progress)}%
        </Typography>
      </Box>
    </Box>
  );
}

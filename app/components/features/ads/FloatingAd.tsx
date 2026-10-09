"use client";

import { useState, useEffect } from "react";
import { Box, IconButton, Paper, Portal } from "@mui/material";
import { useAdTracking } from "./useAdTracking";
import { advertisementNavigation } from "./adNavigation";
import { adDeviceDisplay } from "@/lib/advertisements";
import { maggaColors } from "@/lib/design-tokens";
import CloseIcon from "@mui/icons-material/Close";

interface FloatingAdProps {
  ad: {
    id: string;
    type: string;
    title: string;
    imageUrl: string;
    linkUrl?: string | null;
    linkUrls?: string[] | null;
    content?: string | null;
    targetDevice?: string;
  };
}

export default function FloatingAd({ ad }: FloatingAdProps) {
  const tracking = useAdTracking(ad.id);
  const navigation = advertisementNavigation(ad, tracking.onClick);
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

  if (isDismissed || !isVisible) return null;

  const imageAlt = ad.title ? `โฆษณา: ${ad.title}` : "โฆษณา";
  const image = (
    <Box
      component="img"
      src={ad.imageUrl}
      ref={tracking.imageRef}
      onLoad={tracking.onLoad}
      decoding="async"
      alt={imageAlt}
      sx={{
        width: "100%",
        height: "auto",
        display: "block",
      }}
    />
  );

  return (
    <Portal><Paper
      sx={{
        position: "fixed",
        bottom: 20,
        right: 20,
        maxWidth: 200,
        bgcolor: maggaColors.surface,
        display: adDeviceDisplay(ad.targetDevice),
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

      {navigation.href ? (
        <Box
          component="a"
          {...navigation}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`เปิดโฆษณา: ${ad.title || ad.id}`}
          sx={{
            cursor: "pointer",
            display: "block",
            "&:focus-visible": { outline: `2px solid ${maggaColors.archiveGoldHover}`, outlineOffset: 2 },
          }}
        >
          {image}
        </Box>
      ) : (
        <Box sx={{ display: "block" }}>{image}</Box>
      )}
    </Paper></Portal>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Dialog, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface AdModalProps {
  ad: {
    id: string;
    type: string;
    title: string;
    imageUrl: string;
    linkUrl?: string | null;
    content?: string | null;
  };
}

export default function AdModal({ ad }: AdModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if shown in this session
    const shown = sessionStorage.getItem(`ad_modal_shown_${ad.id}`);
    if (!shown) {
      // Show after 1 second delay
      const timer = setTimeout(() => setOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [ad.id]);

  const handleClose = () => {
    sessionStorage.setItem(`ad_modal_shown_${ad.id}`, "true");
    setOpen(false);
  };

  const handleClick = () => {
    handleClose();
  };
  const imageAlt = ad.title ? `โฆษณา: ${ad.title}` : "โฆษณา";
  const image = (
    <Box
      component="img"
      src={ad.imageUrl}
      alt={imageAlt}
      sx={{
        maxWidth: "100%",
        maxHeight: "80vh",
        display: "block",
      }}
    />
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      PaperProps={{
        sx: {
          bgcolor: "transparent",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
          borderRadius: 1,
        },
      }}
    >
      <IconButton
        onClick={handleClose}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 1,
          bgcolor: "rgba(0,0,0,0.5)",
          color: "white",
          "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
        }}
        aria-label="ปิด"
      >
        <CloseIcon />
      </IconButton>

      {/* Flexible auto-ratio image */}
      {ad.linkUrl ? (
        <Box
          component="a"
          href={ad.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`เปิดโฆษณา: ${ad.title || ad.id}`}
          onClick={handleClick}
          sx={{
            cursor: "pointer",
            display: "block",
            "&:focus-visible": { outline: "2px solid #fbbf24", outlineOffset: 2 },
          }}
        >
          {image}
        </Box>
      ) : (
        <Box sx={{ display: "block" }}>{image}</Box>
      )}
    </Dialog>
  );
}

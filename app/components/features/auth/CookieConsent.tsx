"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Button, Paper, Slide } from "@mui/material";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasConsented = localStorage.getItem("cookieConsent");
    if (!hasConsented) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "true");
    window.dispatchEvent(new Event("cookieConsentChanged"));
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookieConsent", "false");
    window.dispatchEvent(new Event("cookieConsentChanged"));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <Slide direction="up" in={isVisible} mountOnEnter unmountOnExit>
      <Paper
        elevation={8}
        sx={{
          position: "fixed",
          bottom: { xs: 12, md: 20 },
          left: { xs: 12, md: 20 },
          right: { xs: 12, md: "auto" },
          maxWidth: { xs: "100%", md: 320 },
          p: 2,
          borderRadius: 1.5,
          bgcolor: "#171717",
          border: "none",
          zIndex: 1300,
          boxShadow: "0 12px 40px -8px rgba(0,0,0,0.5)",
        }}
      >
        {/* Main Content Row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 2,
          }}
        >
          {/* Cookie Emoji */}
          <Box
            sx={{
              fontSize: 40,
              animation: "wobble 3s ease-in-out infinite",
              "@keyframes wobble": {
                "0%, 100%": { transform: "rotate(0deg)" },
                "25%": { transform: "rotate(-5deg)" },
                "75%": { transform: "rotate(5deg)" },
              },
            }}
          >
            🍪
          </Box>

          {/* Text */}
          <Typography
            variant="body2"
            sx={{
              color: "#e5e5e5",
              lineHeight: 1.5,
              fontSize: "0.8rem",
            }}
          >
            เว็บไซต์ของเราใช้คุกกี้เพื่อมอบประสบการณ์ที่ดีที่สุดให้คุณ...
          </Typography>
        </Box>

        {/* Buttons - Right aligned */}
        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
          <Button
            size="small"
            variant="contained"
            onClick={handleAccept}
            sx={{
              bgcolor: "#fbbf24",
              color: "#000",
              fontWeight: 600,
              fontSize: "0.75rem",
              px: 2,
              py: 0.5,
              minHeight: 28,
              borderRadius: 0.5,
              "&:hover": {
                bgcolor: "#f59e0b",
              },
            }}
          >
            ยอมรับ
          </Button>
          <Button
            size="small"
            variant="text"
            onClick={handleDecline}
            sx={{
              color: "#a3a3a3",
              fontSize: "0.75rem",
              px: 1.5,
              py: 0.5,
              minHeight: 28,
              "&:hover": {
                color: "#fafafa",
                bgcolor: "rgba(255,255,255,0.05)",
              },
            }}
          >
            ปฏิเสธ
          </Button>
        </Box>
      </Paper>
    </Slide>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  Button,
  Typography,
  Box,
} from "@mui/material";

export default function AgeVerificationModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if user has already verified
    const isVerified = localStorage.getItem("isAgeVerified");
    if (!isVerified) {
      setOpen(true);
    }
  }, []);

  const handleVerify = () => {
    localStorage.setItem("isAgeVerified", "true");
    setOpen(false);
  };

  const handleExit = () => {
    window.location.href = "https://www.google.com";
  };

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      aria-labelledby="age-verification-title"
      aria-describedby="age-verification-description"
      PaperProps={{
        sx: {
          borderRadius: 1,
          textAlign: "center",
          p: 4,
          maxWidth: "440px",
          background: "linear-gradient(145deg, #1a1a2e 0%, #0f0f1a 50%, #1a1025 100%)",
          border: "1px solid rgba(168, 85, 247, 0.15)",
          boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.6)",
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(12px)",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
          },
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Typography
          variant="subtitle1"
          sx={{
            color: "rgba(168, 85, 247, 0.9)",
            fontWeight: 600,
            mb: 2,
            fontSize: "1.1rem",
            textTransform: "uppercase",
            letterSpacing: "3px",
          }}
        >
          ยืนยันอายุ
        </Typography>

        {/* Age Verification Image */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <Image
            src="/age18ver.webp"
            alt="Age Verification"
            width={160}
            height={140}
            priority
            style={{ objectFit: "contain" }}
          />
        </Box>

        {/* Main Question */}
        <Typography
          id="age-verification-title"
          variant="h5"
          sx={{
            fontWeight: "bold",
            background: "linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #FBBF24 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 1.5,
            fontSize: "1.6rem",
          }}
        >
          คุณอายุ 18 ปีขึ้นไปหรือไม่?
        </Typography>

        {/* Description */}
        <Typography
          id="age-verification-description"
          variant="body2"
          sx={{
            color: "rgba(255, 255, 255, 0.6)",
            mb: 4,
            px: 2,
            lineHeight: 1.7,
            fontSize: "0.9rem",
          }}
        >
          หน้านี้อาจมีเนื้อหาที่ไม่เหมาะสมสำหรับผู้ที่อายุต่ำกว่า 18 ปี
        </Typography>

        {/* Buttons */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "center",
            px: 2,
          }}
        >
          <Button
            variant="outlined"
            onClick={handleExit}
            sx={{
              borderRadius: 25,
              py: 1.3,
              px: 4,
              fontWeight: 600,
              textTransform: "none",
              fontSize: "1rem",
              color: "rgba(255, 255, 255, 0.7)",
              borderColor: "rgba(255, 255, 255, 0.2)",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              minWidth: 110,
              transition: "all 0.3s ease",
              "&:hover": {
                borderColor: "rgba(255, 255, 255, 0.4)",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "white",
              },
            }}
          >
            ไม่ใช่
          </Button>
          <Button
            variant="contained"
            onClick={handleVerify}
            sx={{
              borderRadius: 25,
              py: 1.3,
              px: 5,
              fontWeight: 700,
              textTransform: "none",
              fontSize: "1rem",
              background: "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)",
              color: "#0f0f1a",
              minWidth: 130,
              boxShadow: "0 2px 8px rgba(251, 191, 36, 0.25)",
              transition: "all 0.3s ease",
              "&:hover": {
                background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                boxShadow: "0 4px 12px rgba(251, 191, 36, 0.35)",
              },
            }}
          >
            ใช่
          </Button>
        </Box>

        {/* Decorative elements */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.5), rgba(251, 191, 36, 0.5), transparent)",
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

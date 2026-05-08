"use client";

import Link from "next/link";
import { Box, Button, Container, Typography } from "@mui/material";
import { Home as HomeIcon } from "@mui/icons-material";
import { maggaColors, maggaMotion, maggaRadii, maggaShadows } from "@/lib/design-tokens";

export default function NotFound() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: maggaColors.midnightCanvas,
        color: maggaColors.textPrimary,
        textAlign: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontSize: { xs: "8rem", md: "12rem" },
            fontWeight: 900,
            lineHeight: 1,
            color: maggaColors.archiveGold,
            textShadow: "0 10px 28px rgba(0, 0, 0, 0.55)",
            mb: 2,
            letterSpacing: 0,
          }}
        >
          404
        </Typography>

        <Typography
          variant="h4"
          component="h2"
          sx={{
            fontWeight: 700,
            mb: 2,
            color: maggaColors.textPrimary,
          }}
        >
          ไม่พบหน้าที่ต้องการ
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: maggaColors.textSecondary,
            fontSize: "1.1rem",
            mb: 6,
            maxWidth: "600px",
            mx: "auto",
          }}
        >
          ลิงก์นี้อาจถูกลบ ย้ายที่อยู่ หรือยังไม่มีผลงานนี้ในคลัง MAGGA
        </Typography>

        <Link href="/" passHref style={{ textDecoration: "none" }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<HomeIcon />}
            sx={{
              bgcolor: maggaColors.archiveGold,
              color: maggaColors.midnightCanvas,
              fontWeight: "bold",
              px: 4,
              py: 1.5,
              borderRadius: `${maggaRadii.pill}px`,
              fontSize: "1.1rem",
              textTransform: "none",
              boxShadow: maggaShadows.goldGlow,
              transition: `background-color ${maggaMotion.quickState}, transform ${maggaMotion.quickState}, box-shadow ${maggaMotion.quickState}`,
              "&:hover": {
                bgcolor: maggaColors.archiveGoldHover,
                transform: "translateY(-2px)",
                boxShadow: "0 0 30px rgba(251, 191, 36, 0.5)",
              },
            }}
          >
            กลับหน้าแรก
          </Button>
        </Link>
      </Container>
    </Box>
  );
}

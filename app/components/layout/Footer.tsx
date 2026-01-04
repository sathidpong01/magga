"use client";

import {
  Box,
  Container,
  Typography,
  Link,
  Button,
  Grid,
  Divider,
} from "@mui/material";
import NextLink from "next/link";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";

export default function Footer() {
  const { data: session } = useSession();

  const policyLinks = [
    { label: "นโยบายความเป็นส่วนตัว", href: "/privacy" },
    { label: "ข้อตกลงในการใช้งาน", href: "/terms" },
    { label: "รายงานการละเมิด", href: "/report" },
  ];

  return (
    <Box
      component="footer"
      sx={{
        py: 5,
        px: 2,
        mt: "auto",
        backgroundColor: "#0a0a0a",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        color: "#a3a3a3",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="flex-start">
          {/* Logo & Description */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Image
                src="/logo.svg"
                alt="MAGGA Logo"
                width={120}
                height={120}
                style={{
                  filter: "drop-shadow(0 0 20px rgba(139, 92, 246, 0.3))",
                }}
              />
            </Box>
            <Typography
              variant="body1"
              sx={{
                color: "#737373",
                fontSize: "0.95rem",
                lineHeight: 1.8,
                maxWidth: 450,
              }}
            >
              เว็บอ่านโดจินแปลไทย 18+ แนว Furry ที่ครบเครื่องที่สุด
              รวบรวมมังงะและโดจินชิ Furry สายหมี สายเคโมะ หลากหลายแนว
              แปลไทยคุณภาพ อ่านฟรีออนไลน์
            </Typography>
          </Grid>

          {/* Policy Links */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{ textAlign: { xs: "left", md: "right" } }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                color: "#fafafa",
                fontWeight: 700,
                mb: 2,
                fontSize: "1rem",
              }}
            >
              นโยบาย
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                alignItems: { xs: "flex-start", md: "flex-end" },
              }}
            >
              {policyLinks.map((link) => (
                <Link
                  key={link.href}
                  component={NextLink}
                  href={link.href}
                  underline="hover"
                  sx={{
                    color: "#a3a3a3",
                    fontSize: "0.95rem",
                    "&:hover": { color: "#fbbf24" },
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: "rgba(255,255,255,0.08)" }} />

        {/* Copyright */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "#525252", fontSize: "0.85rem" }}
          >
            Copyright © {new Date().getFullYear()} MAGGA. All rights reserved.
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Link
              component={NextLink}
              href="/changelog"
              underline="hover"
              sx={{
                color: "#fbbf24",
                fontWeight: 600,
                fontSize: "0.9rem",
                "&:hover": {
                  color: "#fcd34d",
                },
              }}
            >
              Changelog
            </Link>

            {/* Sign In button - Reserve fixed width to prevent CLS */}
            <Box sx={{ minWidth: 50 }}>
              {!session && (
                <Button
                  onClick={() => signIn()}
                  variant="text"
                  size="small"
                  sx={{
                    color: "#525252",
                    fontSize: "0.8rem",
                    minWidth: "auto",
                    p: 0,
                    "&:hover": { color: "#a3a3a3", bgcolor: "transparent" },
                  }}
                >
                  Sign In
                </Button>
              )}
            </Box>

            <Link
              href="https://www.facebook.com/nightsu9/"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{
                color: "#ffffff",
                fontSize: "0.85rem",
                "&:hover": { color: "#a3a3a3" },
              }}
            >
              Create by Nightsu ❤️
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

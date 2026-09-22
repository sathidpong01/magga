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
import { useSession } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import NextLink from "next/link";
import Image from "next/image";


export default function Footer() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const policyLinks = [
    { label: "นโยบายความเป็นส่วนตัว", href: "/privacy" },
    { label: "ข้อตกลงในการใช้งาน", href: "/terms" },
    { label: "รายงานการละเมิด", href: "/report" },
  ];

  return (
    <Box
      component="footer"
      sx={{
        py: { xs: 4, sm: 5 },
        px: 2,
        mt: "auto",
        backgroundColor: "#111113",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        color: "#a1a1aa",
      }}
    >
      <Container maxWidth="lg">
        <Grid
          container
          spacing={4}
          sx={{
            alignItems: "flex-start",
          }}
        >
          {/* Logo & Description */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ mb: 1.5 }}>
              <Image
                src="/logo.svg"
                alt="MAGGA Logo"
                width={110}
                height={32}
                style={{
                  width: "auto",
                  height: "auto",
                  maxHeight: "32px",
                }}
              />
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: "#8e8e93",
                fontSize: "0.875rem",
                lineHeight: 1.7,
                maxWidth: 440,
              }}
            >
              เว็บอ่านโดจินแปลไทย 18+ แนว Furry ที่ครบเครื่องที่สุด
              รวบรวมมังงะและโดจินชิ Furry สายหมี สายเคโมะ หลากหลายแนว
              แปลไทยคุณภาพ อ่านฟรีออนไลน์
            </Typography>
          </Grid>

          {/* Policy Links */}
          <Grid
            sx={{ textAlign: { xs: "left", md: "right" } }}
            size={{ xs: 12, md: 6 }}
          >
            <Typography
              variant="subtitle2"
              component="p"
              sx={{
                color: "#e4e4e7",
                fontWeight: 600,
                mb: 1.5,
                fontSize: "0.875rem",
              }}
            >
              นโยบาย & ข้อมูล
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.25,
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
                    color: "#a1a1aa",
                    fontSize: "0.875rem",
                    transition: "color 0.2s ease",
                    "&:hover": { color: "#f59e0b" },
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: { xs: 3, sm: 3.5 }, borderColor: "rgba(255, 255, 255, 0.06)" }} />

        {/* Copyright & Extra Links */}
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
            sx={{ color: "#71717a", fontSize: "0.8rem" }}
          >
            Copyright © {new Date().getFullYear()} MAGGA. All rights reserved.
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
            <Link
              component={NextLink}
              href="/changelog"
              underline="hover"
              sx={{
                color: "#f59e0b",
                fontWeight: 500,
                fontSize: "0.85rem",
                "&:hover": {
                  color: "#fbbf24",
                },
              }}
            >
              Changelog
            </Link>

            {/* Sign In button - Reserve fixed width to prevent CLS */}
            <Box sx={{ minWidth: 50 }}>
              {mounted && !session && (
                <Button
                  component={NextLink}
                  href="/auth/signin"
                  prefetch={false}
                  variant="text"
                  size="small"
                  sx={{
                    color: "#71717a",
                    fontSize: "0.8rem",
                    minWidth: "auto",
                    p: 0,
                    textTransform: "none",
                    "&:hover": { color: "#a1a1aa", bgcolor: "transparent" },
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
                color: "#a1a1aa",
                fontSize: "0.8rem",
                "&:hover": { color: "#f59e0b" },
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

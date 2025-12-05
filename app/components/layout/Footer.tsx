"use client";

import { Box, Container, Typography, Link, Button, Grid, Divider } from "@mui/material";
import NextLink from "next/link";
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
        py: 4,
        px: 2,
        mt: "auto",
        backgroundColor: "#0a0a0a",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        color: "#a3a3a3"
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Policy Links */}
          <Grid item xs={12} sm={4}>
            <Typography 
              variant="subtitle2" 
              sx={{ color: '#fafafa', fontWeight: 700, mb: 2 }}
            >
              นโยบาย
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {policyLinks.map((link) => (
                <Link
                  key={link.href}
                  component={NextLink}
                  href={link.href}
                  underline="hover"
                  sx={{ 
                    color: '#a3a3a3',
                    fontSize: '0.875rem',
                    '&:hover': { color: '#fbbf24' }
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={4}>
            <Typography 
              variant="subtitle2" 
              sx={{ color: '#fafafa', fontWeight: 700, mb: 2 }}
            >
              ลิงก์ด่วน
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link
                component={NextLink}
                href="/"
                underline="hover"
                sx={{ color: '#a3a3a3', fontSize: '0.875rem', '&:hover': { color: '#fbbf24' } }}
              >
                หน้าแรก
              </Link>
              <Link
                component={NextLink}
                href="/changelog"
                underline="hover"
                sx={{ color: '#a3a3a3', fontSize: '0.875rem', '&:hover': { color: '#fbbf24' } }}
              >
                Changelog
              </Link>
              {!session && (
                <Link
                  component="button"
                  onClick={() => signIn()}
                  underline="hover"
                  sx={{ 
                    color: '#a3a3a3', 
                    fontSize: '0.875rem', 
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    p: 0,
                    '&:hover': { color: '#fbbf24' } 
                  }}
                >
                  เข้าสู่ระบบ
                </Link>
              )}
            </Box>
          </Grid>

          {/* About */}
          <Grid item xs={12} sm={4}>
            <Typography 
              variant="subtitle2" 
              sx={{ color: '#fafafa', fontWeight: 700, mb: 2 }}
            >
              เกี่ยวกับ
            </Typography>
            <Typography variant="body2" sx={{ color: '#737373', fontSize: '0.8rem', lineHeight: 1.6 }}>
              MAGGA เป็นแพลตฟอร์มอ่านการ์ตูน Furry แปลไทย เนื้อหาทั้งหมดเป็นลิขสิทธิ์ของเจ้าของผลงาน
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.08)' }} />

        {/* Copyright */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#525252', fontSize: '0.75rem' }}>
            Copyright © {new Date().getFullYear()} MAGGA. All rights reserved.
          </Typography>
          <Link 
            href="https://www.facebook.com/nightsu9/" 
            target="_blank" 
            rel="noopener noreferrer"
            underline="hover"
            sx={{ color: '#525252', fontSize: '0.75rem', '&:hover': { color: '#a3a3a3' } }}
          >
            Create by Nightsu ❤️
          </Link>
        </Box>
      </Container>
    </Box>
  );
}

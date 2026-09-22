"use client";

import Link from "next/link";
import { Box, Typography, Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LanguageIcon from "@mui/icons-material/Language";
import TelegramIcon from "@mui/icons-material/Telegram";
import XIcon from "@mui/icons-material/X";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { type AuthorProfile } from "@/lib/manga-list";
import { maggaColors } from "@/lib/design-tokens";

interface AuthorHeaderCardProps {
  author: AuthorProfile;
}

// Helper to determine social platform styling and clean display label
function getSocialPlatformInfo(url: string, rawLabel?: string) {
  const lowerUrl = url.toLowerCase();

  // Patreon
  if (lowerUrl.includes("patreon.com")) {
    const handle = url.split("patreon.com/")[1]?.split(/[?#/]/)[0] || rawLabel || "Patreon";
    return {
      name: "Patreon",
      label: handle,
      borderColor: "rgba(239, 68, 68, 0.45)",
      bgColor: "rgba(239, 68, 68, 0.08)",
      hoverBg: "rgba(239, 68, 68, 0.16)",
      textColor: "#fca5a5",
      type: "patreon" as const,
    };
  }

  // X / Twitter
  if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) {
    const domain = lowerUrl.includes("x.com") ? "x.com" : "twitter.com";
    const handle = url.split(`${domain}/`)[1]?.split(/[?#/]/)[0];
    const displayLabel = handle ? `x.com/${handle}` : rawLabel || "X (Twitter)";
    return {
      name: "X",
      label: displayLabel,
      borderColor: "rgba(56, 189, 248, 0.35)",
      bgColor: "rgba(56, 189, 248, 0.06)",
      hoverBg: "rgba(56, 189, 248, 0.14)",
      textColor: "#e0f2fe",
      type: "x" as const,
    };
  }

  // Telegram
  if (lowerUrl.includes("t.me") || lowerUrl.includes("telegram.me")) {
    const handle = url.split("t.me/")[1]?.split(/[?#/]/)[0];
    const displayLabel = handle ? `t.me/${handle}` : rawLabel || "Telegram";
    return {
      name: "Telegram",
      label: displayLabel,
      borderColor: "rgba(56, 189, 248, 0.35)",
      bgColor: "rgba(56, 189, 248, 0.06)",
      hoverBg: "rgba(56, 189, 248, 0.14)",
      textColor: "#bae6fd",
      type: "telegram" as const,
    };
  }

  // Pixiv / Fanbox
  if (lowerUrl.includes("pixiv.net") || lowerUrl.includes("fanbox.cc")) {
    return {
      name: "Pixiv",
      label: rawLabel || "Pixiv",
      borderColor: "rgba(59, 130, 246, 0.4)",
      bgColor: "rgba(59, 130, 246, 0.08)",
      hoverBg: "rgba(59, 130, 246, 0.16)",
      textColor: "#93c5fd",
      type: "pixiv" as const,
    };
  }

  // Default / Website
  return {
    name: "Website",
    label: rawLabel || url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] || "Website",
    borderColor: "rgba(245, 158, 11, 0.35)",
    bgColor: "rgba(245, 158, 11, 0.06)",
    hoverBg: "rgba(245, 158, 11, 0.14)",
    textColor: "#fde68a",
    type: "website" as const,
  };
}

// Custom SVG Icons for authentic Tailspace look
function PatreonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="15" cy="8.5" r="5.5" fill="#f87171" />
      <rect x="4" y="3" width="3.5" height="18" rx="1.5" fill="#f87171" />
    </svg>
  );
}

function PixivIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path
        fill="#60a5fa"
        d="M5.5 3C4.1 3 3 4.1 3 5.5v13C3 19.9 4.1 21 5.5 21h13c1.4 0 2.5-1.1 2.5-2.5v-13C21 4.1 19.9 3 18.5 3h-13zm6.2 3.8c2.8 0 4.7 1.8 4.7 4.3 0 2.6-2 4.4-4.8 4.4h-2.3v3.7H7.1V6.8h4.6zm-.2 2.3h-2.2v4.1h2.2c1.4 0 2.4-.8 2.4-2s-1-2.1-2.4-2.1z"
      />
    </svg>
  );
}

export default function AuthorHeaderCard({ author }: AuthorHeaderCardProps) {
  // Collect all valid social pills
  const socialPills: Array<{
    url: string;
    info: ReturnType<typeof getSocialPlatformInfo>;
  }> = [];

  if (author.socialLinks && author.socialLinks.length > 0) {
    for (const link of author.socialLinks) {
      if (link.url) {
        socialPills.push({
          url: link.url,
          info: getSocialPlatformInfo(link.url, link.label),
        });
      }
    }
  }

  // If profileUrl exists and isn't already included in socialPills, add it
  if (author.profileUrl && !socialPills.some((p) => p.url === author.profileUrl)) {
    socialPills.unshift({
      url: author.profileUrl,
      info: getSocialPlatformInfo(author.profileUrl, "Profile"),
    });
  }

  return (
    <Box sx={{ mb: 3.5 }}>
      {/* Breadcrumbs matching Tailspace: Home > Browse > Frank Motta */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          mb: 1.75,
          fontSize: "0.88rem",
        }}
      >
        <Link
          href="/"
          style={{
            color: maggaColors.archiveGoldHover,
            textDecoration: "none",
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          หน้าแรก
        </Link>
        <Typography
          component="span"
          sx={{ color: maggaColors.textMuted, fontSize: "0.85rem", userSelect: "none" }}
        >
          &gt;
        </Typography>
        <Typography
          component="span"
          sx={{ color: maggaColors.textSecondary, fontSize: "0.88rem", fontWeight: 400 }}
        >
          ผู้แต่ง
        </Typography>
        <Typography
          component="span"
          sx={{ color: maggaColors.textMuted, fontSize: "0.85rem", userSelect: "none" }}
        >
          &gt;
        </Typography>
        <Typography
          component="span"
          sx={{
            color: maggaColors.textPrimary,
            fontWeight: 600,
            fontSize: "0.88rem",
          }}
        >
          {author.name}
        </Typography>
      </Box>

      {/* Hero Author Card */}
      <Box
        sx={{
          bgcolor: "#17181c",
          border: `1px solid rgba(255, 255, 255, 0.08)`,
          borderRadius: "14px",
          p: { xs: 2.5, sm: 3 },
          position: "relative",
          boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.4)",
          transition: "border-color 0.2s ease",
          "&:hover": {
            borderColor: "rgba(255, 255, 255, 0.12)",
          },
        }}
      >
        {/* Top Row: Author Name + Badge + Clear Filter Button */}
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "1.6rem", sm: "2rem" },
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              {author.name}
            </Typography>

            {/* Pill Badge beside name */}
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                px: 1.4,
                py: 0.35,
                borderRadius: "9999px",
                fontSize: "0.78rem",
                fontWeight: 500,
                border: author.hasAuthorRecord
                  ? "1px solid rgba(245, 158, 11, 0.4)"
                  : "1px solid rgba(16, 185, 129, 0.4)",
                color: author.hasAuthorRecord ? "#fbbf24" : "#34d399",
                bgcolor: author.hasAuthorRecord
                  ? "rgba(245, 158, 11, 0.08)"
                  : "rgba(16, 185, 129, 0.08)",
                letterSpacing: "0.01em",
              }}
            >
              {author.hasAuthorRecord ? "นักวาด / ผู้แต่งแนะนำ" : "นักวาด / ผู้แต่ง"}
            </Box>
          </Box>

          {/* Dismiss / Clear Filter Button */}
          <Link href="/" style={{ textDecoration: "none" }}>
            <Button
              size="small"
              startIcon={<CloseIcon sx={{ fontSize: "1rem" }} />}
              sx={{
                color: maggaColors.textSecondary,
                bgcolor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "9999px",
                px: 1.6,
                py: 0.5,
                fontSize: "0.8rem",
                textTransform: "none",
                fontWeight: 500,
                transition: "all 0.15s ease",
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  borderColor: "rgba(255, 255, 255, 0.2)",
                },
              }}
            >
              แสดงผลงานทั้งหมด
            </Button>
          </Link>
        </Box>

        {/* Subtitle Row: X comics · Maintained by moderators */}
        <Typography
          sx={{
            color: maggaColors.textSecondary,
            fontSize: "0.88rem",
            mt: 1,
            mb: socialPills.length > 0 ? 2.2 : 0,
            display: "flex",
            alignItems: "center",
            gap: 0.75,
          }}
        >
          <span>{author.mangaCount} ผลงาน</span>
          <span>·</span>
          <span>อัปเดตโดยผู้ดูแลระบบ</span>
        </Typography>

        {/* Social Link Pills Row */}
        {socialPills.length > 0 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1.2,
            }}
          >
            {socialPills.map((pill, idx) => (
              <Box
                key={idx}
                component="a"
                href={pill.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.6,
                  py: 0.55,
                  borderRadius: "9999px",
                  border: `1px solid ${pill.info.borderColor}`,
                  bgcolor: pill.info.bgColor,
                  color: pill.info.textColor,
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: pill.info.hoverBg,
                    transform: "translateY(-1px)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                  },
                }}
              >
                {pill.info.type === "patreon" && <PatreonIcon />}
                {pill.info.type === "x" && <XIcon sx={{ fontSize: 15, color: "#e0f2fe" }} />}
                {pill.info.type === "telegram" && (
                  <TelegramIcon sx={{ fontSize: 16, color: "#38bdf8" }} />
                )}
                {pill.info.type === "pixiv" && <PixivIcon />}
                {pill.info.type === "website" && (
                  <LanguageIcon sx={{ fontSize: 15, color: "#fde68a" }} />
                )}

                <span>{pill.info.label}</span>
                <OpenInNewIcon sx={{ fontSize: 12, opacity: 0.6, ml: -0.3 }} />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

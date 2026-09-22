"use client";

import { memo } from "react";
import { Card, Typography, Box, Chip } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { maggaColors, maggaShadows } from "@/lib/design-tokens";

// Minimal interface for MangaCard - only fields we actually use
export interface MangaWithDetails {
  id: string;
  slug: string;
  title: string;
  coverImage: string;
  viewCount: number;
  averageRating: number;
  tags: { id: string; name: string }[];
  category: { name: string } | null;
  authorName?: string | null;
}

interface MangaCardProps {
  manga: MangaWithDetails;
  priority?: boolean;
}

const MangaCard = ({ manga, priority = false }: MangaCardProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        transition: "transform 0.2s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          "& .manga-cover-wrap": {
            borderColor: maggaColors.archiveGoldBorder,
            boxShadow: maggaShadows.cardAmberHoverLift,
            "& .manga-cover-img": {
              transform: "scale(1.03)",
            },
          },
          "& .manga-title-text": {
            color: "#ffffff",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          },
        },
      }}
    >
      {/* Cover Container (Tailspace 3:4 Aspect Ratio) */}
      <Link
        href={`/${manga.slug}`}
        prefetch={false}
        style={{ display: "block", textDecoration: "none" }}
      >
        <Box
          className="manga-cover-wrap"
          sx={{
            aspectRatio: "3/4",
            position: "relative",
            borderRadius: "10px",
            overflow: "hidden",
            bgcolor: maggaColors.surface,
            border: "1px solid",
            borderColor: maggaColors.border,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            transition: "border-color 0.25s ease, box-shadow 0.25s ease",
            cursor: "pointer",
          }}
        >
          <Image
            className="manga-cover-img"
            src={manga.coverImage}
            alt={`Cover of ${manga.title}`}
            fill
            sizes="(max-width: 600px) 45vw, (max-width: 960px) 30vw, 20vw"
            style={{
              objectFit: "cover",
              transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            priority={priority}
            fetchPriority={priority ? "high" : "auto"}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIRAAAgIBAwUBAAAAAAAAAAAAAQIDBAAFERITISIxQVH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAf/EABcRAQEBAQAAAAAAAAAAAAAAAAEAETH/2gAMAwEAAhEDEEA/AM8t6vdmsWJTesSB5GOOTkjbJxR/R9nGMXCu/9k="
          />

          {/* Subtle bottom vignette to separate image edge */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(18, 18, 22, 0.4) 0%, transparent 40%)",
              pointerEvents: "none",
            }}
          />

          {/* Frosted Glass Category Badge (Tailspace Style) */}
          {manga.category && (
            <Box
              sx={{
                position: "absolute",
                top: 10,
                right: 10,
                zIndex: 2,
              }}
            >
              <Chip
                label={manga.category.name}
                size="small"
                sx={{
                  bgcolor: "rgba(18, 18, 22, 0.85)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#f4f4f5",
                  fontWeight: 600,
                  height: 28,
                  fontSize: "0.8rem",
                  letterSpacing: "0.03em",
                  px: 0.5,
                  borderRadius: "6px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                }}
              />
            </Box>
          )}
        </Box>
      </Link>

      {/* Metadata Under Cover (Tailspace Anatomy) */}
      <Box
        sx={{
          pt: 1,
          px: 0.25,
          pb: 0.5,
          display: "flex",
          flexDirection: "column",
          gap: 0.35,
        }}
      >
        {/* Title - Strictly 1 Line */}
        <Link
          href={`/${manga.slug}`}
          prefetch={false}
          style={{ textDecoration: "none", display: "block" }}
        >
          <Typography
            className="manga-title-text"
            variant="body2"
            component="h2"
            sx={{
              fontWeight: 500,
              color: maggaColors.textPrimary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: "0.92rem",
              lineHeight: 1.3,
              transition: "color 0.15s ease",
            }}
          >
            {manga.title}
          </Typography>
        </Link>

        {/* Author Line - 1 Line, Clickable Filter */}
        <Box sx={{ minHeight: "1.2rem", display: "flex", alignItems: "center" }}>
          {manga.authorName ? (
            <Link
              href={`/?author=${encodeURIComponent(manga.authorName)}`}
              prefetch={false}
              style={{
                textDecoration: "none",
                display: "inline-block",
                maxWidth: "100%",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: maggaColors.textSecondary,
                  fontSize: "0.78rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "block",
                  lineHeight: 1.25,
                  transition: "color 0.15s ease",
                  "&:hover": {
                    color: maggaColors.archiveGoldHover,
                    textDecoration: "underline",
                  },
                }}
              >
                {manga.authorName}
              </Typography>
            </Link>
          ) : (
            <Typography
              variant="caption"
              sx={{
                color: maggaColors.textMuted,
                fontSize: "0.78rem",
                fontStyle: "italic",
                lineHeight: 1.25,
              }}
            >
              ไม่ระบุผู้แต่ง
            </Typography>
          )}
        </Box>

        {/* Stats Row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            fontSize: "0.75rem",
            color: maggaColors.textSecondary,
            mt: 0.15,
          }}
        >
          {manga.averageRating > 0 && (
            <>
              <Box
                component="span"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.35,
                  color: maggaColors.textPrimary,
                  fontWeight: 500,
                }}
              >
                <Box
                  component="span"
                  sx={{ color: maggaColors.archiveGold, fontSize: "0.8rem" }}
                >
                  ⭐
                </Box>{" "}
                {manga.averageRating.toFixed(1)}
              </Box>
              <Box component="span" sx={{ opacity: 0.4 }}>•</Box>
            </>
          )}
          <Typography
            variant="caption"
            sx={{ color: maggaColors.textMuted, fontSize: "0.72rem" }}
          >
            {manga.viewCount >= 1000000
              ? `${(manga.viewCount / 1000000).toFixed(1)}M`
              : manga.viewCount >= 1000
              ? `${(manga.viewCount / 1000).toFixed(1)}K`
              : manga.viewCount}{" "}
            Views
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default memo(MangaCard);

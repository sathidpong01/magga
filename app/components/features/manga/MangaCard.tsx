"use client";

import { memo } from "react";
import { Card, CardActionArea, Typography, Box, Chip } from "@mui/material";
import Image from "next/image";
import Link from "next/link";

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
}

interface MangaCardProps {
  manga: MangaWithDetails;
  priority?: boolean;
}

function MangaCard({ manga, priority = false }: MangaCardProps) {
  return (
    <Card
      sx={{
        height: 400,
        position: "relative",
        borderRadius: 1, // 16px standard
        overflow: "hidden",
        boxShadow:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        },
        bgcolor: "#171717",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <CardActionArea
        component={Link}
        href={`/${manga.slug}`}
        sx={{ height: "100%" }}
      >
        <Box sx={{ position: "absolute", inset: 0 }}>
          <Image
            src={manga.coverImage}
            alt={`Cover of ${manga.title}`}
            fill
            sizes="(max-width: 600px) 50vw, (max-width: 960px) 33vw, 25vw"
            style={{ objectFit: "cover" }}
            priority={priority}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIRAAAgIBAwUBAAAAAAAAAAAAAQIDBAAFERITISIxQVH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAf/EABcRAQEBAQAAAAAAAAAAAAAAAAEAETH/2gAMAwEAAhEDEEA/AM8t6vdmsWJTesSB5GOOTkjbJxR/R9nGMXCu/9k="
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
            }}
          />
        </Box>
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            p: 3,
            color: "white",
          }}
        >
          {manga.category && (
            <Chip
              label={manga.category.name}
              size="small"
              sx={{
                bgcolor: "#fbbf24",
                color: "black",
                fontWeight: "bold",
                mb: 1,
                height: 20,
                fontSize: "0.7rem",
              }}
            />
          )}
          <Typography
            variant="h5"
            component="h2"
            fontWeight={600}
            sx={{
              mb: 0.5,
              textShadow: "0 2px 4px rgba(0,0,0,0.8)", // Stronger shadow
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              lineHeight: 1.2,
              color: "#fff",
            }}
          >
            {manga.title}
          </Typography>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, opacity: 0.9 }}
          >
            {manga.averageRating > 0 && (
              <>
                <Typography
                  variant="body2"
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <span style={{ color: "#fbbf24" }}>⭐</span>{" "}
                  {manga.averageRating.toFixed(1)}
                </Typography>
                <Typography variant="body2">•</Typography>
              </>
            )}
            <Typography variant="body2">
              {manga.viewCount >= 1000000
                ? `${(manga.viewCount / 1000000).toFixed(1)}M`
                : manga.viewCount >= 1000
                ? `${(manga.viewCount / 1000).toFixed(1)}K`
                : manga.viewCount}{" "}
              Views
            </Typography>
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
}

export default memo(MangaCard);

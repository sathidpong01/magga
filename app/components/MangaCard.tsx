"use client";

import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { Manga, Tag } from "@prisma/client";

interface MangaWithDetails extends Manga {
  tags: Tag[];
  category: { name: string } | null;
}

interface MangaCardProps {
  manga: MangaWithDetails;
}

export default function MangaCard({ manga }: MangaCardProps) {
  return (
    <Card sx={{ 
      height: "100%",
      backgroundColor: "#171717",
      border: "1px solid rgba(255, 255, 255, 0.06)",
      borderRadius: 2,
      transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, border-color 0.3s ease",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: "0 16px 32px -8px rgba(0, 0, 0, 0.5)",
        borderColor: "rgba(251, 191, 36, 0.3)",
      },
    }}>
      <CardActionArea component={Link} href={`/${manga.slug}`} sx={{ height: "100%", display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          <Box sx={{ 
            position: "relative", 
            height: 300, 
            width: "100%", 
            overflow: "hidden",
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "40%",
              background: "linear-gradient(to top, rgba(10, 10, 10, 0.9) 0%, transparent 100%)",
              pointerEvents: "none"
            }
          }}>
            <Image
              src={manga.coverImage}
              alt={`Cover of ${manga.title}`}
              fill
              sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 33vw"
              style={{ objectFit: "cover" }}
              priority={false}
            />
        </Box>
        <CardContent sx={{ flexGrow: 1, width: "100%" }}>
          <Typography gutterBottom variant="h6" component="div" noWrap sx={{ fontWeight: 600, mb: 1 }}>
            {manga.title}
          </Typography>
          {/* Description removed as requested */}
          
          {/* Stats: View Count & Rating */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1 }}>
            {/* View Count */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: "#38bdf8", fontSize: "0.7rem" }}>
                👁️
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                {manga.viewCount.toLocaleString()}
              </Typography>
            </Box>

            {/* Rating */}
            {manga.averageRating > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: "#fbbf24", fontSize: "0.7rem" }}>
                  ⭐
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                  {manga.averageRating.toFixed(1)}
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* Category Display */}
          {manga.category && (
            <Chip 
              label={manga.category.name} 
              size="small" 
              sx={{ 
                fontSize: "0.7rem", 
                height: 22,
                backgroundColor: "rgba(251, 191, 36, 0.12)",
                color: "#fbbf24",
                border: "1px solid rgba(251, 191, 36, 0.25)",
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: "rgba(251, 191, 36, 0.18)",
                }
              }} 
            />
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

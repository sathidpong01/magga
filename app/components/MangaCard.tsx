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
      borderRadius: 0.5, // Reduced border radius (~4px)
      transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
      "&:hover": {
        boxShadow: "0 12px 24px -10px rgba(0, 0, 0, 0.3)",
        "& .MuiCardMedia-root": {
        },
      },
    }}>
      <CardActionArea component={Link} href={`/${manga.id}`} sx={{ height: "100%", display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          <Box sx={{ position: "relative", height: 300, width: "100%", overflow: "hidden" }}>
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
          {/* Category Display */}
          {manga.category && (
            <Chip 
              label={manga.category.name} 
              size="small" 
              variant="outlined" 
              sx={{ 
                fontSize: "0.75rem", 
                height: 24,
                borderColor: 'primary.main',
                color: 'primary.main',
                fontWeight: 500
              }} 
            />
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

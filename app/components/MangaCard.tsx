"use client";

import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
} from "@mui/material";
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
        <Box sx={{ overflow: "hidden", height: 300, width: "100%" }}>
          <CardMedia
            component="img"
            sx={{
              height: "100%",
              width: "100%",
              objectFit: "cover",
              transition: "transform 0.3s ease-in-out",
            }}
            image={manga.coverImage}
            alt={`Cover of ${manga.title}`}
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

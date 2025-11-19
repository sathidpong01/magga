"use client";

import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { Manga } from "@prisma/client";

interface MangaCardProps {
  manga: Manga;
}

export default function MangaCard({ manga }: MangaCardProps) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardActionArea component={Link} href={`/${manga.id}`} sx={{ height: "100%", display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        <CardMedia
          component="img"
          sx={{
            height: 300, // Fixed height for uniformity
            objectFit: "cover",
          }}
          image={manga.coverImage}
          alt={`Cover of ${manga.title}`}
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography gutterBottom variant="h6" component="div" noWrap>
            {manga.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: '3',
              WebkitBoxOrient: 'vertical',
          }}>
            {manga.description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

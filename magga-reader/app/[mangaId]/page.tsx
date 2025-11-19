import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Typography,
  Chip,
  Container,
  Grid,
  Paper,
} from "@mui/material";

type MangaPageProps = {
  params: {
    mangaId: string;
  };
};

export async function generateMetadata({ params }: MangaPageProps) {
  const manga = await prisma.manga.findUnique({
    where: {
      id: params.mangaId,
    },
  });

  if (!manga) {
    return {
      title: "Not Found",
    };
  }

  return {
    title: manga.title,
    description: manga.description,
  };
}

export default async function MangaPage({ params }: MangaPageProps) {
  const manga = await prisma.manga.findUnique({
    where: {
      id: params.mangaId,
    },
    include: {
      category: true,
      tags: true,
    },
  });

  if (!manga) {
    notFound();
  }

  const pages: string[] = (() => {
    if (!manga.pages) return [];
    if (Array.isArray(manga.pages)) return manga.pages;
    try {
      return JSON.parse(manga.pages as unknown as string) as string[];
    } catch {
      return [];
    }
  })();

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, my: 4 }}>
        <Grid container spacing={3}>
          {/* Cover Image */}
          <Grid item xs={12} sm={4}>
            <Box
              component="img"
              src={manga.coverImage}
              alt={`Cover of ${manga.title}`}
              sx={{ width: "100%", height: "auto", borderRadius: 2 }}
            />
          </Grid>

          {/* Details */}
          <Grid item xs={12} sm={8}>
            <Typography variant="h3" component="h1" gutterBottom>
              {manga.title}
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              {manga.description}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
              {manga.category && (
                <Chip
                  label={manga.category.name}
                  component={Link}
                  href={`/category/${encodeURIComponent(manga.category.name)}`}
                  clickable
                  color="primary"
                />
              )}
              {manga.tags.map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  component={Link}
                  href={`/tag/${encodeURIComponent(tag.name)}`}
                  clickable
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Manga Pages Reader */}
      <Box sx={{ mt: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {pages.map((pageUrl, index) => (
          <Box
            key={index}
            component="img"
            src={pageUrl}
            alt={`Page ${index + 1} of ${manga.title}`}
            sx={{
              maxWidth: "100%",
              height: "auto",
              mb: 1, // Margin between pages
            }}
          />
        ))}
      </Box>
    </Container>
  );
}


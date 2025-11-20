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
  params: Promise<{
    mangaId: string;
  }>;
};

export async function generateMetadata({ params }: MangaPageProps) {
  const { mangaId } = await params;
  const manga = await prisma.manga.findUnique({
    where: {
      id: mangaId,
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
  const { mangaId } = await params;
  const manga = await prisma.manga.findUnique({
    where: {
      id: mangaId,
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
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 2, md: 4 }, 
          my: 4,
          backgroundColor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 4,
        }}
      >
        <Grid container spacing={4}>
          {/* Cover Image */}
          <Grid item xs={12} sm={4}>
            <Box
              sx={{
                position: "relative",
                width: "100%",
                paddingTop: "140%", // Aspect ratio for cover
                borderRadius: 2,
                overflow: "hidden",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
            >
              <Box
                component="img"
                src={manga.coverImage}
                alt={`Cover of ${manga.title}`}
                sx={{ 
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%", 
                  height: "100%", 
                  objectFit: "cover" 
                }}
              />
            </Box>
          </Grid>

          {/* Details */}
          <Grid item xs={12} sm={8}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800, background: "linear-gradient(45deg, #8b5cf6, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {manga.title}
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary" sx={{ fontSize: "1.1rem", lineHeight: 1.7 }}>
              {manga.description}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 3 }}>
              {manga.category && (
                <Chip
                  label={manga.category.name}
                  component={Link}
                  href={`/category/${encodeURIComponent(manga.category.name)}`}
                  clickable
                  color="primary"
                  sx={{ fontWeight: 600 }}
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
                  sx={{ borderColor: "rgba(255,255,255,0.2)" }}
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

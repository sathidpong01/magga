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
  Avatar,
} from "@mui/material";
import Image from "next/image";

type MangaPageProps = {
  params: Promise<{
    mangaId: string;
  }>;
};

export async function generateMetadata({ params }: MangaPageProps) {
  const { mangaId } = await params;
  const decodedSlug = decodeURIComponent(mangaId);
  const manga = await prisma.manga.findUnique({
    where: {
      slug: decodedSlug,
    },
  });

  if (!manga) {
    return {
      title: "Not Found",
    };
  }

  // Safe Metadata for Social Sharing (Masking)
  return {
    title: manga.title, // Browser tab still shows real title
    description: manga.description,
    openGraph: {
      title: "Magga Reader - Read Manga Online", // Safe Title for Facebook/Line
      description: "Read your favorite manga online for free. High quality images and fast loading.", // Safe Description
      images: [
        {
          url: "https://placehold.co/1200x630/png?text=Magga+Reader", // Safe Placeholder Image
          width: 1200,
          height: 630,
          alt: "Magga Reader",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Magga Reader - Read Manga Online",
      description: "Read your favorite manga online for free.",
      images: ["https://placehold.co/1200x630/png?text=Magga+Reader"],
    },
  };
}

export default async function MangaPage({ params }: MangaPageProps) {
  const { mangaId } = await params;
  const decodedSlug = decodeURIComponent(mangaId);
  
  // Try to find by slug
  const manga = await prisma.manga.findUnique({
    where: {
      slug: decodedSlug,
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
                <Image
                  src={manga.coverImage}
                  alt={`Cover of ${manga.title}`}
                  fill
                  sizes="(max-width: 600px) 100vw, 33vw"
                  style={{ objectFit: "cover" }}
                  priority
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

            {/* Author Credits */}
            {manga.authorCredits && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Author / Credits:
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {(() => {
                    try {
                      const credits = JSON.parse(manga.authorCredits) as {
                        url: string;
                        label: string;
                        icon: string;
                      }[];
                      return credits.map((credit, index) => (
                        <Chip
                          key={index}
                          avatar={
                            credit.icon ? (
                              <Avatar src={credit.icon} alt={credit.label} />
                            ) : undefined
                          }
                          label={credit.label}
                          component="a"
                          href={credit.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          clickable
                          variant="outlined"
                          sx={{
                            borderColor: "rgba(255,255,255,0.2)",
                            "& .MuiChip-avatar": {
                              width: 24,
                              height: 24,
                            },
                          }}
                        />
                      ));
                    } catch {
                      return null;
                    }
                  })()}
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Manga Pages Reader */}
      <Box sx={{ mt: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {pages.map((pageUrl, index) => (
          <Box
            key={index}
            sx={{
              position: "relative",
              width: "100%",
              mb: 1,
            }}
          >
            <Image
              src={pageUrl}
              alt={`Page ${index + 1} of ${manga.title}`}
              width={0}
              height={0}
              sizes="100vw"
              style={{ width: "100%", height: "auto" }}
              loading="lazy"
            />
          </Box>
        ))}
      </Box>
    </Container>
  );
}

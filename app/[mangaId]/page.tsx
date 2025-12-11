import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import LinkChip from "@/app/components/ui/LinkChip";
import {
  Box,
  Typography,
  Chip,
  Container,
  Grid,
  Paper,
  Avatar,
  Stack,
} from "@mui/material";
import Image from "next/image";
import MangaViewRating from "@/app/components/features/manga/MangaViewRating";
import VisibilityIcon from "@mui/icons-material/Visibility";
import StarIcon from "@mui/icons-material/Star";
import { SuspendedMangaReader, SuspendedCommentSection } from "./manga-content";
import { AdContainer } from "@/app/components/features/ads";
import ScrollToTop from "@/app/components/ui/ScrollToTop";

type MangaPageProps = {
  params: Promise<{
    mangaId: string;
  }>;
};

// ISR: Revalidate every 1 hour (On-demand revalidation handles immediate updates)
export const revalidate = 3600;

// Pre-render top 50 manga at build time for better performance
export async function generateStaticParams() {
  const topMangas = await prisma.manga.findMany({
    where: { isHidden: false },
    select: { slug: true },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return topMangas.map((manga) => ({
    mangaId: manga.slug,
  }));
}

export async function generateMetadata({ params }: MangaPageProps) {
  const { mangaId } = await params;
  const decodedSlug = decodeURIComponent(mangaId);
  const manga = await prisma.manga.findUnique({
    where: {
      slug: decodedSlug,
    },
    include: {
      tags: true,
      category: true,
    },
  });

  if (!manga) {
    return {
      title: "Not Found",
    };
  }

  // Check for sensitive content
  const SENSITIVE_KEYWORDS = [
    "18+",
    "adult",
    "hentai",
    "ecchi",
    "mature",
    "smut",
    "yaoi",
    "yuri",
    "doujinshi",
    "nsfw",
  ];
  const hasSensitiveTag = manga.tags.some((tag) =>
    SENSITIVE_KEYWORDS.includes(tag.name.toLowerCase())
  );
  const hasSensitiveCategory =
    manga.category &&
    SENSITIVE_KEYWORDS.includes(manga.category.name.toLowerCase());
  const isSensitive = hasSensitiveTag || hasSensitiveCategory;

  // Format title with author name: [Author] - Title
  const authorName = (manga as any).authorName;
  const displayTitle = authorName
    ? `[${authorName}] - ${manga.title}`
    : manga.title;

  // Use generic description for sensitive content
  const description = isSensitive
    ? `Read ${manga.title} online at Magga Reader. High quality images and fast loading.`
    : manga.description;

  // Always use site logo for OG image (safe for all content)
  const ogImage = "/android-chrome-512x512.png";

  return {
    title: displayTitle,
    description: description,
    openGraph: {
      title: `${displayTitle} - MAGGA`,
      description: description || "Read your favorite manga online for free.",
      url: `/${manga.slug}`,
      siteName: "MAGGA",
      images: [
        {
          url: ogImage,
          width: 512,
          height: 512,
          alt: "MAGGA",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayTitle} - MAGGA`,
      description: description || "Read your favorite manga online for free.",
      images: [ogImage],
    },
  };
}

export default async function MangaPage({ params }: MangaPageProps) {
  const { mangaId } = await params;

  // Safely decode URI, handle malformed URIs
  let decodedSlug: string;
  try {
    decodedSlug = decodeURIComponent(mangaId);
  } catch {
    notFound();
  }

  const manga = await prisma.manga.findUnique({
    where: {
      slug: decodedSlug,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      coverImage: true,
      pages: true,
      authorCredits: true,
      category: true,
      tags: true,
      viewCount: true,
      averageRating: true,
      ratingCount: true,
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
    <Box sx={{ minHeight: "100vh", bgcolor: "#0a0a0a", pb: 8 }}>
      {/* Hero / Header Section with Blurred Background */}
      <Box sx={{ position: "relative", overflow: "hidden", mb: -4 }}>
        {/* Background Image Layer */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            opacity: 0.3,
            filter: "blur(40px)",
            transform: "scale(1.1)", // Prevent blur edges
          }}
        >
          <Image
            src={manga.coverImage}
            alt=""
            fill
            style={{ objectFit: "cover" }}
            priority
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(10,10,10,0.2) 0%, #0a0a0a 100%)",
            }}
          />
        </Box>

        <Container
          maxWidth="lg"
          sx={{
            position: "relative",
            zIndex: 1,
            pt: { xs: 4, md: 6 },
            pb: { xs: 4, md: 4 },
          }}
        >
          <Grid container spacing={4}>
            {/* Left: Cover Image */}
            <Grid
              item
              xs={12}
              md={4}
              lg={3}
              sx={{
                display: "flex",
                justifyContent: { xs: "center", md: "flex-start" },
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  maxWidth: { xs: "280px", md: "100%" },
                  aspectRatio: "2/3",
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: "0 20px 40px -10px rgba(0,0,0,0.7)",
                  border: "1px solid rgba(255,255,255,0.1)",
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

            {/* Right: Details */}
            <Grid
              item
              xs={12}
              md={8}
              lg={9}
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
              }}
            >
              <Box>
                {/* Category Chip */}
                {manga.category && (
                  <Chip
                    label={manga.category.name}
                    component="a"
                    href={`/category/${encodeURIComponent(
                      manga.category.name
                    )}`}
                    clickable
                    sx={{
                      bgcolor: "#fbbf24",
                      color: "black",
                      fontWeight: "bold",
                      mb: 2,
                      fontSize: "0.85rem",
                      height: 28,
                      "&:hover": { bgcolor: "#f59e0b" },
                    }}
                  />
                )}

                {/* Title */}
                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    mb: 1,
                    fontSize: { xs: "2.5rem", md: "3.5rem" },
                    lineHeight: 1.1,
                    background:
                      "linear-gradient(135deg, #fbbf24 0%, #38bdf8 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.3))",
                  }}
                >
                  {manga.title}
                </Typography>

                {/* Author Credits */}
                {(() => {
                  if (!manga.authorCredits) return null;

                  try {
                    const credits = JSON.parse(manga.authorCredits) as {
                      url: string;
                      label: string;
                      icon: string;
                    }[];

                    if (credits.length === 0) return null;

                    return (
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 2,
                          mb: 2,
                        }}
                      >
                        {credits.map((credit, index) => (
                          <Chip
                            key={index}
                            avatar={
                              credit.icon ? (
                                <Avatar
                                  src={credit.icon}
                                  alt=""
                                  sx={{ width: 28, height: 28 }}
                                />
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
                              height: 36,
                              fontSize: "0.9rem",
                              borderColor: "rgba(255,255,255,0.2)",
                              color: "rgba(255,255,255,0.85)",
                              "& .MuiChip-label": {
                                px: 1.5,
                              },
                              "&:hover": {
                                borderColor: "rgba(255,255,255,0.5)",
                                color: "white",
                                bgcolor: "rgba(255,255,255,0.05)",
                              },
                            }}
                          />
                        ))}
                      </Box>
                    );
                  } catch {
                    return null;
                  }
                })()}

                {/* Stats Row */}
                <Stack
                  direction="row"
                  spacing={3}
                  alignItems="center"
                  sx={{ mb: 3, color: "text.secondary" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <VisibilityIcon sx={{ fontSize: 20 }} />
                    <Typography variant="subtitle1" fontWeight={500}>
                      {manga.viewCount.toLocaleString()} Views
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <StarIcon sx={{ fontSize: 20, color: "#fbbf24" }} />
                    <Typography
                      variant="subtitle1"
                      fontWeight={500}
                      sx={{ color: "white" }}
                    >
                      {manga.averageRating > 0
                        ? manga.averageRating.toFixed(1)
                        : "No rating"}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      ({manga.ratingCount} ratings)
                    </Typography>
                  </Box>
                </Stack>

                {/* Description */}
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: "1.1rem",
                    lineHeight: 1.7,
                    color: "rgba(255,255,255,0.8)",
                    maxWidth: "800px",
                    mb: 4,
                  }}
                >
                  {manga.description}
                </Typography>

                {/* Tags */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
                  {manga.tags.map((tag) => (
                    <LinkChip
                      key={tag.id}
                      label={tag.name}
                      href={`/tag/${encodeURIComponent(tag.name)}`}
                      sx={{
                        backgroundColor: "rgba(56, 189, 248, 0.1)",
                        color: "#38bdf8",
                        border: "1px solid rgba(56, 189, 248, 0.3)",
                        fontSize: "0.85rem",
                        "&:hover": {
                          backgroundColor: "rgba(56, 189, 248, 0.2)",
                          borderColor: "#38bdf8",
                        },
                      }}
                    />
                  ))}
                </Box>

                {/* Rating Component */}
                <MangaViewRating
                  mangaId={manga.id}
                  initialViewCount={manga.viewCount}
                  initialAverageRating={manga.averageRating}
                  initialRatingCount={manga.ratingCount}
                  hideViewCount={true}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Main Content Area */}
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        {/* Pages / Reader with scroll tracking - Suspense wrapped */}
        <SuspendedMangaReader
          mangaId={manga.id}
          mangaTitle={manga.title}
          pages={pages}
        />

        {/* โฆษณาท้ายหน้าอ่าน */}
        <Box sx={{ mt: 4, maxWidth: "800px", mx: "auto" }}>
          <AdContainer placement="manga-end" />
        </Box>

        {/* General Comments Section - Suspense wrapped */}
        <Box
          sx={{
            mt: 6,
            maxWidth: "800px",
            mx: "auto",
            mr: { xs: "auto", md: "340px" },
          }}
        >
          <SuspendedCommentSection mangaId={manga.id} />
        </Box>
      </Container>

      {/* Back to Top Button */}
      <ScrollToTop />
    </Box>
  );
}

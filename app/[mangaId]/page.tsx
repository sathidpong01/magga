import { db } from "@/db";
import { manga as mangaTable, mangaTags as mangaTagsTable } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
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
import { SuspendedMangaReader } from "./manga-content";
import { CommentSectionSkeleton } from "./loading-skeletons";
import ServerCommentSection from "@/app/components/features/comments/ServerCommentSection";
import { Suspense } from "react";
import { AdContainer } from "@/app/components/features/ads";
import ScrollToTop from "@/app/components/ui/ScrollToTop";
import ShareButton from "@/app/components/ui/ShareButton";
import { getSiteUrl } from "@/lib/site-url";
import { unstable_cache } from "next/cache";
import { normalizeMangaPages } from "@/lib/manga-pages";

type MangaPageProps = {
  params: Promise<{
    mangaId: string;
  }>;
};

// ISR: Revalidate every 1 hour
export const revalidate = 3600;

// Fetch manga data directly
const getMangaBySlug = async (slug: string) => {
  try {
    return await db.query.manga.findFirst({
      where: eq(mangaTable.slug, slug),
      columns: {
        id: true,
        slug: true,
        title: true,
        description: true,
        coverImage: true,
        pages: true,
        authorName: true,
        viewCount: true,
        averageRating: true,
        ratingCount: true,
      },
      with: {
        author: {
          columns: { id: true, name: true, socialLinks: true },
        },
        category: true,
        mangaTags_mangaId: {
          with: { tag_tagId: true },
        },
      },
    });
  } catch (error) {
    console.error(`Error fetching manga ${slug}:`, error);
    return null;
  }
};

// Pre-render top 50 manga at build time
export async function generateStaticParams() {
  try {
    const topMangas = await db.query.manga.findMany({
      where: eq(mangaTable.isHidden, false),
      columns: { slug: true },
      orderBy: [desc(mangaTable.updatedAt)],
      limit: 50,
    });

    return topMangas.map((manga) => ({
      mangaId: manga.slug,
    }));
  } catch (error) {
    console.error("generateStaticParams: Failed to fetch manga slugs, skipping pre-render:", error);
    return [];
  }
}

export async function generateMetadata({ params }: MangaPageProps) {
  const { mangaId } = await params;
  let decodedSlug: string;
  try {
    decodedSlug = decodeURIComponent(mangaId);
  } catch {
    return { title: "Not Found" };
  }

  const mangaData = await getMangaBySlug(decodedSlug);

  if (!mangaData) {
    return { title: "Not Found" };
  }

  const tags = mangaData.mangaTags_mangaId?.map((mt: any) => mt.tag_tagId) || [];

  const SENSITIVE_KEYWORDS = [
    "18+", "adult", "hentai", "ecchi", "mature", "smut", "yaoi", "yuri", "doujinshi", "nsfw",
  ];
  const hasSensitiveTag = tags.some((tag: any) =>
    SENSITIVE_KEYWORDS.includes(tag?.name?.toLowerCase())
  );
  const hasSensitiveCategory =
    mangaData.category && SENSITIVE_KEYWORDS.includes(mangaData.category.name.toLowerCase());
  const isSensitive = hasSensitiveTag || hasSensitiveCategory;

  const authorName = mangaData.author?.name || mangaData.authorName;
  const displayTitle = authorName ? `[${authorName}] - ${mangaData.title}` : mangaData.title;
  const description = isSensitive
    ? `Read ${mangaData.title} online at Magga Reader. High quality images and fast loading.`
    : mangaData.description;
  const ogImage = "/android-chrome-512x512.png";

  return {
    title: displayTitle,
    description,
    openGraph: {
      title: `${displayTitle} - MAGGA`,
      description: description || "Read your favorite manga online for free.",
      url: `/${mangaData.slug}`,
      siteName: "MAGGA",
      images: [{ url: ogImage, width: 512, height: 512, alt: "MAGGA" }],
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

  let decodedSlug: string;
  try {
    decodedSlug = decodeURIComponent(mangaId);
  } catch {
    notFound();
  }

  const mangaData = await getMangaBySlug(decodedSlug);

  if (!mangaData) {
    notFound();
  }

  const manga = {
    ...mangaData,
    tags: mangaData.mangaTags_mangaId?.map((mt: any) => mt.tag_tagId) || [],
  };

  const pages = normalizeMangaPages(manga.pages);

  const baseUrl = getSiteUrl();
  const authorName = manga.author?.name || manga.authorName;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ComicStory",
    name: manga.title,
    url: `${baseUrl}/${manga.slug}`,
    image: manga.coverImage,
    description: manga.description || undefined,
    author: authorName
      ? { "@type": "Person", name: authorName }
      : undefined,
    genre: [
      manga.category?.name,
      ...manga.tags.map((t: any) => t.name),
    ].filter(Boolean),
    numberOfPages: pages.length,
    inLanguage: "th",
    isAccessibleForFree: true,
    publisher: {
      "@type": "Organization",
      name: "MAGGA",
      url: baseUrl,
      logo: { "@type": "ImageObject", url: `${baseUrl}/android-chrome-512x512.png` },
    },
    aggregateRating:
      Number(manga.ratingCount) > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: manga.averageRating,
            ratingCount: Number(manga.ratingCount),
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/ReadAction",
      userInteractionCount: Number(manga.viewCount),
    },
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0a0a0a", pb: 8 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
            transform: "scale(1.1)",
          }}
        >
          <Image
            src={manga.coverImage}
            alt={`Background of ${manga.title}`}
            role="presentation"
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
            <Grid
              sx={{
                display: "flex",
                justifyContent: { xs: "center", md: "flex-start" },
              }}
              size={{ xs: 12, md: 4, lg: 3 }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  maxWidth: { xs: "280px", md: "100%" },
                  aspectRatio: "2/3",
                  borderRadius: 1,
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
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIRAAAgIBAwUBAAAAAAAAAAAAAQIDBAAFERITISIxQVH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAf/EABcRAQEBAQAAAAAAAAAAAAAAAAEAETH/2gAMAwEAAhEDEEA/AM8t6vdmsWJTesSB5GOOTkjbJxR/R9nGMXCu/9k="
                />
              </Box>
            </Grid>

            <Grid
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
              }}
              size={{ xs: 12, md: 8, lg: 9 }}
            >
              <Box>
                {/* Category + Tags */}
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "#737373", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", mb: 0.75, display: "block" }}
                  >
                    หมวดหมู่ / แท็ก
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
                    {manga.category && (
                      <Chip
                        label={manga.category.name}
                        component="a"
                        href={`/category/${encodeURIComponent(manga.category.name)}`}
                        clickable
                        sx={{
                          bgcolor: "#fbbf24",
                          color: "black",
                          fontWeight: "bold",
                          fontSize: "0.85rem",
                          height: 28,
                          borderRadius: 0.75,
                          "&:hover": { bgcolor: "#f59e0b" },
                        }}
                      />
                    )}
                    {manga.tags?.map((tag: any) => (
                      <LinkChip
                        key={tag.id}
                        label={tag.name}
                        href={`/tag/${encodeURIComponent(tag.name)}`}
                        size="small"
                        sx={{
                          height: 28,
                          borderRadius: 0.75,
                          backgroundColor: "rgba(56, 189, 248, 0.1)",
                          color: "#38bdf8",
                          border: "1px solid rgba(56, 189, 248, 0.3)",
                          fontSize: "0.82rem",
                          "&:hover": {
                            backgroundColor: "rgba(56, 189, 248, 0.2)",
                            borderColor: "#38bdf8",
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Box>

                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    mb: 1,
                    fontSize: { xs: "2.5rem", md: "3.5rem" },
                    lineHeight: 1.1,
                    color: "#fafafa",
                    filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.3))",
                  }}
                >
                  {manga.title}
                </Typography>

                {/* Author Social Links */}
                {(() => {
                  if (manga.author?.socialLinks) {
                    try {
                      const links = JSON.parse(manga.author.socialLinks) as {
                        url: string;
                        label: string;
                        icon: string;
                      }[];
                      if (links.length > 0) {
                        return (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                            {links.map((link, index) => (
                              <Chip
                                key={index}
                                avatar={
                                  link.icon ? (
                                    <Avatar src={link.icon} alt="" sx={{ width: 28, height: 28 }} />
                                  ) : undefined
                                }
                                label={link.label || manga.author?.name}
                                component="a"
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                clickable
                                variant="outlined"
                                sx={{
                                  height: 36,
                                  borderRadius: 0.75,
                                  fontSize: "0.9rem",
                                  borderColor: "rgba(255,255,255,0.2)",
                                  color: "rgba(255,255,255,0.85)",
                                  "& .MuiChip-label": { px: 1.5 },
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
                      }
                    } catch {
                      return null;
                    }
                  }
                  return null;
                })()}

                {/* Stats row */}
                <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 2, color: "text.secondary" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <VisibilityIcon sx={{ fontSize: 20 }} />
                    <Typography variant="subtitle1" fontWeight={500}>
                      {Number(manga.viewCount).toLocaleString()} Views
                    </Typography>
                  </Box>
                  <MangaViewRating
                    mangaId={manga.id}
                    initialViewCount={Number(manga.viewCount)}
                    initialAverageRating={manga.averageRating}
                    initialRatingCount={Number(manga.ratingCount)}
                    hideViewCount={true}
                    hideInteractive
                    trackViewOnMount
                  />
                  <Box sx={{ ml: "auto !important" }}>
                    <ShareButton title={manga.title} slug={manga.slug} />
                  </Box>
                </Stack>

                {manga.description && (
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: "1.1rem",
                      lineHeight: 1.7,
                      color: "rgba(255,255,255,0.8)",
                      maxWidth: "800px",
                      mb: 3,
                    }}
                  >
                    {manga.description}
                  </Typography>
                )}

                {/* Interactive Rating */}
                <Box sx={{ mb: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "#737373", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", mb: 0.5, display: "block" }}
                  >
                    ให้คะแนนเรื่องนี้
                  </Typography>
                  <MangaViewRating
                    mangaId={manga.id}
                    initialViewCount={Number(manga.viewCount)}
                    initialAverageRating={manga.averageRating}
                    initialRatingCount={Number(manga.ratingCount)}
                    hideViewCount={true}
                    hideAverage
                  />
                </Box>

              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <SuspendedMangaReader
          mangaId={manga.id}
          mangaTitle={manga.title}
          pages={pages}
        />
        <Box sx={{ mt: 4, maxWidth: "800px", mx: "auto" }}>
          <AdContainer placement="manga-end" />
        </Box>
        <Box sx={{ mt: 6, maxWidth: "800px", mx: "auto", mr: { xs: "auto", md: "340px" } }}>
          <Suspense fallback={<CommentSectionSkeleton />}>
            <ServerCommentSection mangaId={manga.id} />
          </Suspense>
        </Box>
      </Container>

      <ScrollToTop />
    </Box>
  );
}

import { db } from "@/db";
import {
  authors as authorsTable,
  categories as categoriesTable,
  manga as mangaTable,
  mangaTags as mangaTagsTable,
  tags as tagsTable,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
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
import Link from "next/link";
import MangaViewRating from "@/app/components/features/manga/MangaViewRating";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { maggaColors, maggaRadii } from "@/lib/design-tokens";
import { SuspendedMangaReader } from "./manga-content";
import { CommentSectionSkeleton } from "./loading-skeletons";
import CommentSection from "@/app/components/features/comments/CommentSection";
import { cache, Suspense } from "react";
import { AdContainer } from "@/app/components/features/ads";
import ScrollToTop from "@/app/components/ui/ScrollToTop";
import ShareButton from "@/app/components/ui/ShareButton";
import { getSiteUrl } from "@/lib/site-url";
import { normalizeMangaPages } from "@/lib/manga-pages";

type MangaPageProps = {
  params: Promise<{
    mangaId: string;
  }>;
};

// ISR: Revalidate every 1 hour
export const revalidate = 3600;

// Fetch manga data with small indexed queries. Drizzle's relation query generated
// lateral JSON aggregation here, which can exceed Supabase statement timeouts.
const getMangaBySlug = cache(async (slug: string) => {
  try {
    const [manga] = await db
      .select({
        id: mangaTable.id,
        slug: mangaTable.slug,
        title: mangaTable.title,
        description: mangaTable.description,
        coverImage: mangaTable.coverImage,
        pages: mangaTable.pages,
        authorName: mangaTable.authorName,
        viewCount: mangaTable.viewCount,
        averageRating: mangaTable.averageRating,
        ratingCount: mangaTable.ratingCount,
        categoryId: mangaTable.categoryId,
        authorId: mangaTable.authorId,
      })
      .from(mangaTable)
      .where(and(eq(mangaTable.slug, slug), eq(mangaTable.isHidden, false)))
      .limit(1);

    if (!manga) {
      return null;
    }

    const [authorRows, categoryRows, tagRows] = await Promise.all([
      manga.authorId
        ? db
            .select({
              id: authorsTable.id,
              name: authorsTable.name,
              socialLinks: authorsTable.socialLinks,
            })
            .from(authorsTable)
            .where(eq(authorsTable.id, manga.authorId))
            .limit(1)
        : Promise.resolve([]),
      manga.categoryId
        ? db
            .select({
              id: categoriesTable.id,
              name: categoriesTable.name,
            })
            .from(categoriesTable)
            .where(eq(categoriesTable.id, manga.categoryId))
            .limit(1)
        : Promise.resolve([]),
      db
        .select({
          id: tagsTable.id,
          name: tagsTable.name,
        })
        .from(mangaTagsTable)
        .innerJoin(tagsTable, eq(tagsTable.id, mangaTagsTable.tagId))
        .where(eq(mangaTagsTable.mangaId, manga.id)),
    ]);

    return {
      ...manga,
      author: authorRows[0] ?? null,
      category: categoryRows[0] ?? null,
      mangaTags_mangaId: tagRows.map((tag) => ({ tag_tagId: tag })),
    };
  } catch (error) {
    console.error(`Error fetching manga ${slug}:`, error);
    throw error;
  }
});

export async function generateMetadata({ params }: MangaPageProps): Promise<Metadata> {
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
    ? `อ่าน ${mangaData.title} บน MAGGA`
    : mangaData.description?.trim() || `อ่าน ${mangaData.title} บน MAGGA`;
  const canonicalPath = `/${encodeURIComponent(mangaData.slug)}`;
  const ogImage = "/android-chrome-512x512.png";

  return {
    title: displayTitle,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: `${displayTitle} - MAGGA`,
      description,
      url: canonicalPath,
      siteName: "MAGGA",
      images: [{ url: ogImage, width: 512, height: 512, alt: "MAGGA" }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayTitle} - MAGGA`,
      description,
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
    url: `${baseUrl}/${encodeURIComponent(manga.slug)}`,
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
    <Box sx={{ minHeight: "100vh", bgcolor: maggaColors.background, pb: 8 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      {/* Hero / Header Section with Blurred Background */}
      <Box sx={{ position: "relative", overflow: "hidden", mb: -4 }}>
        {/* Background Image Layer */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            opacity: 0.25,
            filter: "blur(40px)",
            transform: "scale(1.1)",
          }}
        >
          <Image
            src={manga.coverImage}
            alt={`Background of ${manga.title}`}
            role="presentation"
            fill
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(to bottom, rgba(20,20,22,0.4) 0%, rgba(20,20,22,0.85) 60%, ${maggaColors.background} 100%)`,
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
                  aspectRatio: "3/4",
                  borderRadius: `${maggaRadii.card}px`,
                  overflow: "hidden",
                  boxShadow: "0 20px 40px -10px rgba(0,0,0,0.7)",
                  border: `1px solid ${maggaColors.border}`,
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
                    sx={{ color: maggaColors.textMuted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", mb: 0.75, display: "block" }}
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
                          bgcolor: maggaColors.archiveGold,
                          color: maggaColors.midnightCanvas,
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          height: 28,
                          borderRadius: 0.75,
                          "&:hover": { bgcolor: maggaColors.archiveGoldHover },
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
                          backgroundColor: "rgba(255, 255, 255, 0.06)",
                          color: maggaColors.textSecondary,
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          fontSize: "0.82rem",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            backgroundColor: "rgba(255, 255, 255, 0.12)",
                            borderColor: "rgba(255, 255, 255, 0.25)",
                            color: maggaColors.textPrimary,
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
                    color: maggaColors.textPrimary,
                  }}
                >
                  {manga.title}
                </Typography>

                {/* Author Name */}
                {authorName && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: maggaColors.textMuted,
                        fontSize: "0.95rem",
                        fontWeight: 500,
                      }}
                    >
                      ผู้แต่ง:
                    </Typography>
                    <Link
                      href={`/?author=${encodeURIComponent(authorName)}`}
                      style={{ textDecoration: "none" }}
                    >
                      <Typography
                        component="span"
                        sx={{
                          color: maggaColors.archiveGold,
                          fontWeight: 700,
                          fontSize: "1.05rem",
                          transition: "color 0.15s ease",
                          "&:hover": {
                            color: maggaColors.archiveGoldHover,
                            textDecoration: "underline",
                          },
                        }}
                      >
                        {authorName}
                      </Typography>
                    </Link>
                  </Box>
                )}

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
                                  borderColor: "rgba(255,255,255,0.15)",
                                  color: maggaColors.textSecondary,
                                  "& .MuiChip-label": { px: 1.5 },
                                  "&:hover": {
                                    borderColor: "rgba(255,255,255,0.4)",
                                    color: maggaColors.textPrimary,
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
                <Stack
                  direction="row"
                  spacing={3}
                  sx={{
                    alignItems: "center",
                    mb: 2,
                    color: "text.secondary"
                  }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <VisibilityIcon sx={{ fontSize: 20 }} />
                    <Typography variant="subtitle1" sx={{
                      fontWeight: 500
                    }}>
                      {Number(manga.viewCount).toLocaleString()} Views
                    </Typography>
                  </Box>
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
                      color: maggaColors.textSecondary,
                      maxWidth: "800px",
                      mb: 3,
                    }}
                  >
                    {manga.description}
                  </Typography>
                )}

                {/* Rating & Review */}
                <Box
                  sx={{
                    mb: 2,
                    p: 2,
                    borderRadius: "10px",
                    bgcolor: maggaColors.surface,
                    border: `1px solid ${maggaColors.border}`,
                    maxWidth: "420px",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: maggaColors.textMuted,
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      mb: 0.75,
                      display: "block",
                    }}
                  >
                    คะแนนและการรีวิว
                  </Typography>
                  <MangaViewRating
                    mangaId={manga.id}
                    initialViewCount={Number(manga.viewCount)}
                    initialAverageRating={manga.averageRating}
                    initialRatingCount={Number(manga.ratingCount)}
                    hideViewCount={true}
                    trackViewOnMount
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
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mr: { xs: 0, md: "340px" }, mt: 4 }}>
          <Box sx={{ width: "100%", maxWidth: "1000px" }}>
            <AdContainer placement="manga-end" />
          </Box>
        </Box>
        <Box sx={{ mt: 6, maxWidth: "800px", mx: "auto" }}>
          <Suspense fallback={<CommentSectionSkeleton />}>
            <CommentSection mangaId={manga.id} />
          </Suspense>
        </Box>
      </Container>

      <ScrollToTop />
    </Box>
  );
}

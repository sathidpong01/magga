import { db } from "@/db";
import {
  authors as authorsTable,
  categories as categoriesTable,
  manga as mangaTable,
  mangaContributors as mangaContributorsTable,
  mangaTags as mangaTagsTable,
  tags as tagsTable,
} from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getSessionRole } from "@/lib/auth-helpers";
import LinkChip from "@/app/components/ui/LinkChip";
import { Box, Typography, Chip, Container, Grid } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import MangaViewRating from "@/app/components/features/manga/MangaViewRating";
import { maggaColors, maggaRadii } from "@/lib/design-tokens";
import { SuspendedMangaReader } from "./manga-content";
import { CommentSectionSkeleton } from "./loading-skeletons";
import CommentSection from "@/app/components/features/comments/LazyCommentSection";
import { cache, Suspense } from "react";
import { AdContainer } from "@/app/components/features/ads";
import ScrollToTop from "@/app/components/ui/ScrollToTop";
import ShareButton from "@/app/components/ui/ShareButton";
import ReaderStartButton from "@/app/components/ui/ReaderStartButton";
import RelatedManga from "@/app/components/features/manga/RelatedManga";
import { getSiteUrl } from "@/lib/site-url";
import { normalizeMangaPages } from "@/lib/manga-pages";
import SocialLinkIcon from "@/app/components/ui/SocialLinkIcon";

type MangaPageProps = {
  params: Promise<{
    mangaId: string;
  }>;
};

function parseSocialLinks(
  value: string | null,
): Array<{ url: string; label: string; icon: string }> {
  if (!value) return [];
  try {
    const links = JSON.parse(value);
    return Array.isArray(links)
      ? links.filter((link) => typeof link.url === "string" && link.url)
      : [];
  } catch {
    return [];
  }
}

// Draft previews depend on the current viewer and must never enter the shared page cache.
export const dynamic = "force-dynamic";

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
        isHidden: mangaTable.isHidden,
      })
      .from(mangaTable)
      .where(eq(mangaTable.slug, slug))
      .limit(1);

    if (!manga) {
      return null;
    }

    if (manga.isHidden) {
      const session = await auth.api.getSession({
        headers: await headers(),
        query: { disableCookieCache: true },
      });
      const role = getSessionRole(session);
      if (
        !session?.user?.id ||
        session.user.banned ||
        session.user.isBanned ||
        (role !== "admin" && role !== "moderator")
      ) {
        return null;
      }
    }

    const [authorRows, contributorRows, categoryRows, tagRows] =
      await Promise.all([
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
        db
          .select({
            id: authorsTable.id,
            name: authorsTable.name,
            socialLinks: authorsTable.socialLinks,
            role: mangaContributorsTable.role,
          })
          .from(mangaContributorsTable)
          .innerJoin(
            authorsTable,
            eq(authorsTable.id, mangaContributorsTable.authorId),
          )
          .where(eq(mangaContributorsTable.mangaId, manga.id))
          .orderBy(asc(mangaContributorsTable.position)),
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
      contributors: contributorRows,
      category: categoryRows[0] ?? null,
      mangaTags_mangaId: tagRows.map((tag) => ({ tag_tagId: tag })),
    };
  } catch (error) {
    console.error(`Error fetching manga ${slug}:`, error);
    throw error;
  }
});

export async function generateMetadata({
  params,
}: MangaPageProps): Promise<Metadata> {
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

  if (mangaData.isHidden) {
    return {
      title: "ฉบับร่าง - MAGGA",
      robots: { index: false, follow: false },
    };
  }

  const tags =
    mangaData.mangaTags_mangaId?.map((mt: any) => mt.tag_tagId) || [];

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
  const hasSensitiveTag = tags.some((tag: any) =>
    SENSITIVE_KEYWORDS.includes(tag?.name?.toLowerCase()),
  );
  const hasSensitiveCategory =
    mangaData.category &&
    SENSITIVE_KEYWORDS.includes(mangaData.category.name.toLowerCase());
  const isSensitive = hasSensitiveTag || hasSensitiveCategory;

  const authorName =
    [
      mangaData.author?.name,
      ...mangaData.contributors.map((person) => person.name),
    ]
      .filter(Boolean)
      .join(" & ") || mangaData.authorName;
  const displayTitle = authorName
    ? `[${authorName}] - ${mangaData.title}`
    : mangaData.title;
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
  const authorName =
    [manga.author?.name, ...manga.contributors.map((person) => person.name)]
      .filter(Boolean)
      .join(" & ") || manga.authorName;
  const authorCredits = [
    ...(manga.author ? [{ ...manga.author, role: "ผู้แต่ง" }] : []),
    ...manga.contributors,
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ComicStory",
    name: manga.title,
    url: `${baseUrl}/${encodeURIComponent(manga.slug)}`,
    image: manga.coverImage,
    description: manga.description || undefined,
    author: manga.author
      ? { "@type": "Person", name: manga.author.name }
      : authorName
        ? { "@type": "Person", name: authorName }
        : undefined,
    contributor: manga.contributors.map((person) => ({
      "@type": "Person",
      name: person.name,
    })),
    genre: [manga.category?.name, ...manga.tags.map((t: any) => t.name)].filter(
      Boolean,
    ),
    numberOfPages: pages.length,
    inLanguage: "th",
    isAccessibleForFree: true,
    publisher: {
      "@type": "Organization",
      name: "MAGGA",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/android-chrome-512x512.png`,
      },
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
      {!manga.isHidden && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <Box
        component="section"
        sx={{ position: "relative", overflow: "hidden" }}
      >
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            position: "absolute",
            inset: 0,
            opacity: 0.12,
            filter: "blur(24px)",
            pointerEvents: "none",
          }}
        >
          <Image
            src={manga.coverImage}
            alt=""
            fill
            sizes="256px"
            loading="lazy"
            style={{ objectFit: "cover" }}
          />
        </Box>
        <Container
          maxWidth="lg"
          sx={{ position: "relative", py: { xs: 2, md: 4 } }}
        >
          {manga.isHidden && (
            <Typography
              role="status"
              sx={{ color: maggaColors.archiveGoldHover, mb: 2 }}
            >
              ตัวอย่างเรื่องที่ยังไม่เผยแพร่
            </Typography>
          )}
          <Grid
            container
            spacing={{ xs: 2, md: 3 }}
            sx={{ alignItems: "flex-start" }}
          >
            <Grid size={{ xs: 4, md: 3 }}>
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  maxWidth: 256,
                  aspectRatio: "3 / 4",
                  borderRadius: maggaRadii.card + "px",
                  overflow: "hidden",
                  bgcolor: maggaColors.surface,
                }}
              >
                <Image
                  src={manga.coverImage}
                  alt={"Cover of " + manga.title}
                  fill
                  sizes="(max-width: 899px) 30vw, 256px"
                  style={{ objectFit: "cover" }}
                  preload
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 8, md: 9 }}>
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1.35rem", sm: "1.8rem", md: "2.8rem" },
                  lineHeight: 1.3,
                  overflowWrap: "anywhere",
                  mb: 1,
                }}
              >
                {manga.title}
              </Typography>
              {authorCredits.map((person) => (
                <Typography
                  key={person.id}
                  variant="body2"
                  sx={{ mb: 0.5, color: maggaColors.textSecondary }}
                >
                  {person.role}:{" "}
                  <Link
                    href={"/?author=" + encodeURIComponent(person.name)}
                    prefetch={false}
                    style={{
                      color: maggaColors.archiveGoldHover,
                      textDecoration: "none",
                    }}
                  >
                    {person.name}
                  </Link>
                </Typography>
              ))}
              <Typography variant="caption" color="text.secondary">
                {Number(manga.viewCount).toLocaleString()} ครั้งที่อ่าน
              </Typography>
              <MangaViewRating
                key={manga.id + ":header"}
                mangaId={manga.id}
                initialViewCount={Number(manga.viewCount)}
                initialAverageRating={manga.averageRating}
                initialRatingCount={Number(manga.ratingCount)}
                hideInteractive
                trackViewOnMount={!manga.isHidden}
              />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <ReaderStartButton
                  mangaId={manga.id}
                  totalPages={pages.length}
                />
                <ShareButton title={manga.title} slug={manga.slug} />
              </Box>
            </Grid>
          </Grid>
          <Box
            component="details"
            sx={{
              mt: 2,
              color: maggaColors.textSecondary,
              borderTop: "1px solid " + maggaColors.border,
            }}
          >
            <Box
              component="summary"
              sx={{
                cursor: "pointer",
                minHeight: 44,
                py: 1.25,
                color: maggaColors.textPrimary,
              }}
            >
              เรื่องย่อ หมวดหมู่ และเครดิต
            </Box>
            {manga.description && (
              <Typography
                sx={{
                  mb: 2,
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                {manga.description}
              </Typography>
            )}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
              {manga.category && (
                <LinkChip
                  label={manga.category.name}
                  href={"/category/" + encodeURIComponent(manga.category.name)}
                />
              )}
              {manga.mangaTags_mangaId.map(({ tag_tagId: tag }) => (
                <LinkChip
                  key={tag.id}
                  label={tag.name}
                  href={"/tag/" + encodeURIComponent(tag.name)}
                />
              ))}
            </Box>
            {authorCredits.map((person) => (
              <Box key={person.id} sx={{ mb: 2 }}>
                <Typography variant="body2">
                  {person.role}: {person.name}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                  {parseSocialLinks(person.socialLinks).map((link) => (
                    <Chip
                      key={link.url}
                      icon={<SocialLinkIcon url={link.url} />}
                      label={link.label || person.name}
                      component="a"
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      clickable
                      variant="outlined"
                      sx={{ minHeight: 44 }}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Container
        id="reader-start"
        maxWidth="lg"
        sx={{ mt: 2, px: { xs: 0, lg: 3 }, scrollMarginTop: "72px" }}
      >
        <SuspendedMangaReader
          mangaId={manga.id}
          mangaTitle={manga.title}
          mangaSlug={manga.slug}
          remember={!manga.isHidden}
          pages={pages}
        />
      </Container>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mt: 4,
          }}
        >
          <Box sx={{ width: "100%", maxWidth: "1000px" }}>
            <AdContainer placement="manga-end" />
          </Box>
        </Box>
        {!manga.isHidden && (
          <Box sx={{ mt: 3, maxWidth: "800px", mx: "auto" }}>
            <MangaViewRating
              key={manga.id + ":rating"}
              mangaId={manga.id}
              initialViewCount={Number(manga.viewCount)}
              initialAverageRating={manga.averageRating}
              initialRatingCount={Number(manga.ratingCount)}
            />
            <RelatedManga key={manga.id} mangaId={manga.id} />
          </Box>
        )}
        {!manga.isHidden && (
          <Box sx={{ mt: 4, maxWidth: "800px", mx: "auto" }}>
            <Suspense fallback={<CommentSectionSkeleton />}>
              <CommentSection mangaId={manga.id} />
            </Suspense>
          </Box>
        )}
      </Container>

      <ScrollToTop />
    </Box>
  );
}

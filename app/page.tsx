import { db } from "@/db";
import { categories as categoriesTable, tags as tagsTable, advertisements as adsTable, mangaTags } from "@/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { Box, Container, Typography } from "@mui/material";
import type { Metadata } from "next";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { unstable_cache } from "next/cache";
import MangaGridSkeleton from "./components/features/manga/MangaGridSkeleton";
import StreamingMangaGrid from "./components/features/manga/StreamingMangaGrid";
import AuthorHeaderCard from "./components/features/author/AuthorHeaderCard";
import { getAuthorProfile } from "@/lib/manga-list";
import { maggaColors } from "@/lib/design-tokens";

const SearchFilters = dynamic(
  () => import("./components/features/search/SearchFilters"),
  { ssr: true }
);

type Props = {
  searchParams: Promise<{
    search?: string;
    category?: string;
    tags?: string | string[];
    sort?: string;
    author?: string;
  }>;
};

// ISR: Revalidate every 1 hour
export const revalidate = 3600;

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { search, category, tags, sort, author } = await searchParams;
  const hasFilters = Boolean(search || category || (Array.isArray(tags) ? tags.length : tags) || sort || author);
  return {
    alternates: { canonical: "/" },
    ...(hasFilters ? { robots: { index: false, follow: true } } : {}),
  };
}

// Metadata changes infrequently; align its cache lifetime with the page ISR
// to avoid unnecessary Supabase reconnects on the Hobby/Free tiers.
const getCategories = unstable_cache(
  async () => {
    return db.query.categories.findMany({ orderBy: [asc(categoriesTable.name)] });
  },
  ["categories"],
  { revalidate: 3600, tags: ["categories"] }
);

// Cache tags for 1 hour
const getTags = unstable_cache(
  async () => {
    return db
      .selectDistinct({
        id: tagsTable.id,
        name: tagsTable.name,
      })
      .from(tagsTable)
      .innerJoin(mangaTags, eq(tagsTable.id, mangaTags.tagId))
      .orderBy(asc(tagsTable.name));
  },
  ["tags-v2"],
  { revalidate: 3600, tags: ["tags"] }
);

// Cache grid ads for 1 hour
const getGridAds = unstable_cache(
  async () => {
    return db.query.advertisements.findMany({
      where: and(eq(adsTable.isActive, true), eq(adsTable.placement, "grid")),
      columns: {
        id: true,
        type: true,
        title: true,
        imageUrl: true,
        linkUrl: true,
        content: true,
        repeatCount: true,
      },
    });
  },
  ["grid-ads"],
  { revalidate: 3600, tags: ["advertisements"] }
);

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const { search, category: categoryName, tags: tagNames, sort, author } = params;

  // Fetch Categories, Tags, Grid Ads, and Author Profile in parallel with resilient fallbacks
  const [categories, tags, gridAds, authorProfile] = await Promise.all([
    getCategories().catch((err) => {
      console.error("Failed to load categories:", err);
      return [];
    }),
    getTags().catch((err) => {
      console.error("Failed to load tags:", err);
      return [];
    }),
    getGridAds().catch((err) => {
      console.error("Failed to load grid ads:", err);
      return [];
    }),
    author
      ? getAuthorProfile(author).catch((err) => {
          console.error("Failed to load author profile:", err);
          return null;
        })
      : Promise.resolve(null),
  ]);

  // Resolve category name → UUID for DB query
  const categoryId = categoryName
    ? categories.find((c) => c.name === categoryName)?.id
    : undefined;

  const tagNameArray = tagNames
    ? Array.isArray(tagNames)
      ? tagNames
      : [tagNames]
    : [];
  const homePageSize = gridAds.length > 0 ? 11 : 12;

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 1 }}>
        {authorProfile && <AuthorHeaderCard author={authorProfile} />}
        {!authorProfile && (
          <Box sx={{ mb: 1.5 }}>
            <Typography component="h1" variant="h6" sx={{ color: maggaColors.textPrimary, fontWeight: 700 }}>
              การ์ตูน Furry แปลไทย
            </Typography>
            <Typography variant="body2" sx={{ color: maggaColors.textSecondary }}>
              เลือกอ่านเรื่องที่สนใจ ค้นหาตามชื่อ หมวดหมู่ หรือแท็กได้ที่นี่
            </Typography>
          </Box>
        )}

        {/* Reserve space for SearchFilters to prevent CLS */}
        <Suspense fallback={<Box sx={{ minHeight: 56 }} />}>
          <SearchFilters categories={categories} tags={tags} />
        </Suspense>

        <Suspense fallback={<MangaGridSkeleton count={homePageSize} />}>
          <StreamingMangaGrid
            search={search}
            categoryId={categoryId}
            tagNames={tagNameArray}
            sort={sort}
            author={author}
            ads={gridAds as any}
            pageSize={homePageSize}
          />
        </Suspense>
      </Box>
    </Container>
  );
}

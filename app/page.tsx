import { db } from "@/db";
import { categories as categoriesTable, tags as tagsTable, advertisements as adsTable, mangaTags } from "@/db/schema";
import { asc, eq, inArray } from "drizzle-orm";
import { Typography, Box, Container } from "@mui/material";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import MangaGridSkeleton from "./components/features/manga/MangaGridSkeleton";
import { unstable_cache } from "next/cache";

const SearchFilters = dynamic(
  () => import("./components/features/search/SearchFilters"),
  { ssr: true }
);

const StreamingMangaGrid = dynamic(
  () => import("./components/features/manga/StreamingMangaGrid"),
  { ssr: true, loading: () => <MangaGridSkeleton count={12} /> }
);

type Props = {
  searchParams: Promise<{
    search?: string;
    category?: string;
    tags?: string | string[];
    sort?: string;
  }>;
};

// ISR: Revalidate every 1 hour
export const revalidate = 3600;

// Cache categories for 5 minutes
const getCategories = unstable_cache(
  async () => {
    return db.query.categories.findMany({ orderBy: [asc(categoriesTable.name)] });
  },
  ["categories"],
  { revalidate: 300, tags: ["categories"] }
);

// Cache tags for 5 minutes
const getTags = unstable_cache(
  async () => {
    // Tags that are used in at least one manga
    const usedTagIds = await db.selectDistinct({ id: mangaTags.tagId }).from(mangaTags);
    const ids = usedTagIds.map(t => t.id);
    if (ids.length === 0) return [];
    return db.query.tags.findMany({
      where: inArray(tagsTable.id, ids),
      orderBy: [asc(tagsTable.name)],
    });
  },
  ["tags"],
  { revalidate: 300, tags: ["tags"] }
);

// Cache grid ads for 5 minutes
const getGridAds = unstable_cache(
  async () => {
    return db.query.advertisements.findMany({
      where: eq(adsTable.isActive, true),
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
  { revalidate: 300, tags: ["advertisements"] }
);

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const { search, category: categoryName, tags: tagNames, sort } = params;

  // Fetch Categories, Tags and Grid Ads in parallel (cached)
  const [categories, tags, gridAds] = await Promise.all([
    getCategories(),
    getTags(),
    getGridAds(),
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

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 1 }}>
        {/* Reserve space for SearchFilters to prevent CLS */}
        <Suspense fallback={<Box sx={{ minHeight: 56 }} />}>
          <SearchFilters categories={categories} tags={tags} />
        </Suspense>

        {/* Streaming: Manga grid loads progressively while skeleton shows */}
        <Suspense fallback={<MangaGridSkeleton count={12} />}>
          <StreamingMangaGrid
            search={search}
            categoryId={categoryId}
            tagNames={tagNameArray}
            sort={sort}
            ads={gridAds as any}
          />
        </Suspense>
      </Box>
    </Container>
  );
}

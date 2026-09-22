import { db } from "@/db";
import { categories as categoriesTable, tags as tagsTable, advertisements as adsTable, mangaTags } from "@/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { Box, Container } from "@mui/material";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { unstable_cache } from "next/cache";
import MangaGridSkeleton from "./components/features/manga/MangaGridSkeleton";
import StreamingMangaGrid from "./components/features/manga/StreamingMangaGrid";

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
  }>;
};

// ISR: Revalidate every 1 hour
export const revalidate = 3600;

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
  const { search, category: categoryName, tags: tagNames, sort } = params;

  // Fetch Categories, Tags and Grid Ads in parallel with resilient fallbacks
  const [categories, tags, gridAds] = await Promise.all([
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
            ads={gridAds as any}
            pageSize={homePageSize}
          />
        </Suspense>
      </Box>
    </Container>
  );
}

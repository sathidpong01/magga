import prisma from "@/lib/prisma";
import { Typography, Box, Container } from "@mui/material";
import { Suspense } from "react";
import SearchFilters from "./components/features/search/SearchFilters";
import StreamingMangaGrid from "./components/features/manga/StreamingMangaGrid";
import MangaGridSkeleton from "./components/features/manga/MangaGridSkeleton";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

type Props = {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    tags?: string | string[];
    sort?: string;
  }>;
};

// ISR: Revalidate every 1 hour
export const revalidate = 3600;

// Cache categories for 5 minutes
const getCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({ orderBy: { name: "asc" } });
  },
  ["categories"],
  { revalidate: 300, tags: ["categories"] }
);

// Cache tags for 5 minutes
const getTags = unstable_cache(
  async () => {
    return prisma.tag.findMany({
      where: { mangas: { some: {} } },
      orderBy: { name: "asc" },
    });
  },
  ["tags"],
  { revalidate: 300, tags: ["tags"] }
);

// Cache grid ads for 5 minutes
const getGridAds = unstable_cache(
  async () => {
    return prisma.advertisement.findMany({
      where: { isActive: true, placement: "grid" },
      select: {
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
  const { search, categoryId, tags: tagNames, sort } = params;

  // Fetch Categories, Tags and Grid Ads in parallel (cached)
  const [categories, tags, gridAds] = await Promise.all([
    getCategories(),
    getTags(),
    getGridAds(),
  ]);

  // Build Where Clause
  const where: Prisma.MangaWhereInput = {
    isHidden: false,
  };

  if (search) {
    where.title = { contains: search };
  }

  if (categoryId && categoryId !== "all") {
    where.categoryId = categoryId;
  }

  const tagNameArray = tagNames
    ? Array.isArray(tagNames)
      ? tagNames
      : [tagNames]
    : [];

  if (tagNameArray.length > 0) {
    where.tags = {
      some: {
        name: { in: tagNameArray },
      },
    };
  }

  // Build OrderBy Clause
  let orderBy: Prisma.MangaOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "updated") {
    orderBy = { updatedAt: "desc" };
  } else if (sort === "az") {
    orderBy = { title: "asc" };
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Suspense fallback={<Box sx={{ height: 100 }} />}>
          <SearchFilters categories={categories} tags={tags} />
        </Suspense>

        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 800,
            mb: 4,
            background: "linear-gradient(135deg, #fbbf24 0%, #38bdf8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em",
          }}
        >
          {search ? `Search Results for "${search}"` : "Discover Manga"}
        </Typography>

        {/* Streaming: Manga grid loads progressively while skeleton shows */}
        <Suspense fallback={<MangaGridSkeleton count={12} />}>
          <StreamingMangaGrid
            where={where}
            orderBy={orderBy}
            ads={gridAds}
            search={search}
            categoryId={categoryId}
            tags={tagNameArray.join(",")}
            sort={sort}
          />
        </Suspense>
      </Box>
    </Container>
  );
}

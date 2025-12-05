import prisma from "@/lib/prisma";
import { Grid, Typography, Box, Container } from "@mui/material";
import { Suspense } from "react";
import MangaCard from "./components/features/manga/MangaCard";
import SearchFilters from "./components/features/search/SearchFilters";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

type Props = {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    tags?: string | string[]; // Changed from tagIds to tags (names)
    sort?: string;
  }>;
};

// Dynamic rendering to support search/filter params, but cache for 60 seconds
export const revalidate = 60;

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
      orderBy: { name: "asc" } 
    });
  },
  ["tags"],
  { revalidate: 300, tags: ["tags"] }
);

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const { search, categoryId, tags: tagNames, sort } = params;

  // Fetch Categories and Tags for the filter component (cached)
  const categories = await getCategories();
  const tags = await getTags();

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

  if (tagNames) {
    const tagNameArray = Array.isArray(tagNames) ? tagNames : [tagNames];
    if (tagNameArray.length > 0) {
      where.tags = {
        some: {
          name: { in: tagNameArray }, // Filter by name
        },
      };
    }
  }

  // Build OrderBy Clause
  let orderBy: Prisma.MangaOrderByWithRelationInput = { createdAt: "desc" }; // Default to "Added" (Time Posted)
  if (sort === "updated") {
    orderBy = { updatedAt: "desc" };
  } else if (sort === "az") {
    orderBy = { title: "asc" };
  }

  const mangas = await prisma.manga.findMany({
    where,
    orderBy,
    include: {
      category: true,
      tags: true,
    },
  });

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
            letterSpacing: "-0.02em"
          }}
        >
          {search ? `Search Results for "${search}"` : "Discover Manga"}
        </Typography>
        
        {mangas.length === 0 ? (
          <Typography 
            variant="h6" 
            color="text.secondary" 
            align="center" 
            sx={{ mt: 8, fontWeight: 400 }}
          >
            No mangas found matching your criteria.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {mangas.map((manga) => (
              <Grid item key={manga.id} xs={12} sm={6} md={4} lg={3}>
                <MangaCard manga={manga} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
}

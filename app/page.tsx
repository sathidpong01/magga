import prisma from "@/lib/prisma";
import { Grid, Typography, Box, Container } from "@mui/material";
import { Suspense } from "react";
import MangaCard from "./components/MangaCard";
import SearchFilters from "./components/SearchFilters";
import { Prisma } from "@prisma/client";

type Props = {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    tagIds?: string | string[];
    sort?: string;
  }>;
};

// ISR: Revalidate every 60 seconds for frequently changing content
export const revalidate = 60;
export const dynamic = 'force-static';

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const { search, categoryId, tagIds, sort } = params;

  // Fetch Categories and Tags for the filter component
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });

  // Build Where Clause
  const where: Prisma.MangaWhereInput = {
    isHidden: false,
  };

  if (search) {
    where.title = { contains: search }; // SQLite doesn't support mode: 'insensitive' easily without raw query, but 'contains' is often case-insensitive in default SQLite config or we accept it.
  }

  if (categoryId && categoryId !== "all") {
    where.categoryId = categoryId;
  }

  if (tagIds) {
    const tagIdArray = Array.isArray(tagIds) ? tagIds : [tagIds];
    if (tagIdArray.length > 0) {
      where.tags = {
        some: {
          id: { in: tagIdArray },
        },
      };
    }
  }

  // Build OrderBy Clause
  let orderBy: Prisma.MangaOrderByWithRelationInput = { updatedAt: "desc" };
  if (sort === "added") {
    orderBy = { createdAt: "desc" };
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

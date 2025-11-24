import prisma from "@/lib/prisma";
import { Grid, Typography, Box, Container } from "@mui/material";
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
        <SearchFilters categories={categories} tags={tags} />

        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
          {search ? `Search Results for "${search}"` : "All Mangas"}
        </Typography>
        
        {mangas.length === 0 ? (
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 4 }}>
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

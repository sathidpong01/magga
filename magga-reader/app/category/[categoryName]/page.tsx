import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Grid, Typography, Box } from "@mui/material";
import MangaCard from "@/app/components/MangaCard";

type CategoryPageProps = {
  params: {
    categoryName: string;
  };
};

export async function generateMetadata({ params }: CategoryPageProps) {
  const categoryName = decodeURIComponent(params.categoryName);
  return {
    title: `Category: ${categoryName}`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const categoryName = decodeURIComponent(params.categoryName);

  const category = await prisma.category.findUnique({
    where: { name: categoryName },
    include: {
      mangas: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!category) {
    notFound();
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Category: {category.name}
      </Typography>
      <Grid container spacing={3}>
        {category.mangas.map((manga) => (
          <Grid item key={manga.id} xs={12} sm={6} md={4} lg={3}>
            <MangaCard manga={manga} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}


import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Grid, Typography, Box } from "@mui/material";
import MangaCard from "@/app/components/features/manga/MangaCard";

type CategoryPageProps = {
  params: Promise<{
    categoryName: string;
  }>;
};

// ISR: Revalidate every 1 hour (On-demand revalidation handles immediate updates)
export const revalidate = 3600;

export async function generateMetadata({ params }: CategoryPageProps) {
  const { categoryName: encodedCategoryName } = await params;
  const categoryName = decodeURIComponent(encodedCategoryName);
  return {
    title: `Category: ${categoryName}`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { categoryName: encodedCategoryName } = await params;
  const categoryName = decodeURIComponent(encodedCategoryName);

  const category = await prisma.category.findUnique({
    where: { name: categoryName },
    include: {
      mangas: {
        include: {
          tags: true,
          category: true,
        },
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
<Grid key={manga.id}     size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <MangaCard manga={manga} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

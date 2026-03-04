import { db } from "@/db";
import { categories as categoriesTable, manga as mangaTable, mangaTags as mangaTagsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Grid, Typography, Box } from "@mui/material";
import MangaCard from "@/app/components/features/manga/MangaCard";

type CategoryPageProps = {
  params: Promise<{
    categoryName: string;
  }>;
};

// ISR: Revalidate every 1 hour
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

  // Find category by name
  const [category] = await db
    .select({ id: categoriesTable.id, name: categoriesTable.name })
    .from(categoriesTable)
    .where(eq(categoriesTable.name, categoryName))
    .limit(1);

  if (!category) {
    notFound();
  }

  // Get mangas in this category
  const mangaRows = await db.query.manga.findMany({
    where: eq(mangaTable.categoryId, category.id),
    with: {
      category: true,
      mangaTags_mangaId: {
        with: { tag_tagId: true },
      },
    },
    orderBy: (m, { desc }) => [desc(m.createdAt)],
  });

  const mangas = mangaRows
    .filter((m: any) => !m.isHidden)
    .map((m: any) => ({
      ...m,
      tags: m.mangaTags_mangaId?.map((mt: any) => mt.tag_tagId) || [],
    }));

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Category: {category.name}
      </Typography>
      <Grid container spacing={3}>
        {mangas.map((manga: any) => (
          <Grid key={manga.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <MangaCard manga={manga} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

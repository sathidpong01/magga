import { db } from "@/db";
import { tags as tagsTable, manga as mangaTable, mangaTags as mangaTagsTable, categories as categoriesTable } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Grid, Typography, Box } from "@mui/material";
import MangaCard from "@/app/components/features/manga/MangaCard";

type TagPageProps = {
  params: Promise<{
    tagName: string;
  }>;
};

// ISR: Revalidate every 1 hour
export const revalidate = 3600;

export async function generateMetadata({ params }: TagPageProps) {
  const { tagName: encodedTagName } = await params;
  const tagName = decodeURIComponent(encodedTagName);
  return {
    title: `Tag: ${tagName}`,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tagName: encodedTagName } = await params;
  const tagName = decodeURIComponent(encodedTagName);

  // Find tag by name
  const [tag] = await db
    .select({ id: tagsTable.id, name: tagsTable.name })
    .from(tagsTable)
    .where(eq(tagsTable.name, tagName))
    .limit(1);

  if (!tag) {
    notFound();
  }

  // Get mangas with this tag
  const mangaRows = await db.query.mangaTags.findMany({
    where: eq(mangaTagsTable.tagId, tag.id),
    with: {
      manga_mangaId: {
        with: {
          category: true,
          mangaTags_mangaId: {
            with: { tag_tagId: true },
          },
        },
      },
    },
  });

  const mangas = mangaRows
    .map((mt: any) => mt.manga_mangaId)
    .filter(Boolean)
    .filter((m: any) => !m.isHidden)
    .map((m: any) => ({
      ...m,
      tags: m.mangaTags_mangaId?.map((mt: any) => mt.tag_tagId) || [],
    }));

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Tag: {tag.name}
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

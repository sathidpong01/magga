import { notFound } from "next/navigation";
import { Grid, Typography, Box } from "@mui/material";
import MangaCard from "@/app/components/features/manga/MangaCard";
import { getMangasByTagName } from "@/lib/manga-list";

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

  const tag = await getMangasByTagName(tagName);

  if (!tag) {
    notFound();
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Tag: {tag.name}
      </Typography>
      <Grid container spacing={3}>
        {tag.mangas.map((manga) => (
          <Grid key={manga.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <MangaCard manga={manga} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

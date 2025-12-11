import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Grid, Typography, Box } from "@mui/material";
import MangaCard from "@/app/components/features/manga/MangaCard";

type TagPageProps = {
  params: Promise<{
    tagName: string;
  }>;
};

// ISR: Revalidate every 1 hour (On-demand revalidation handles immediate updates)
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

  const tag = await prisma.tag.findUnique({
    where: { name: tagName },
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
          <Grid item key={manga.id} xs={12} sm={6} md={4} lg={3}>
            <MangaCard manga={manga} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

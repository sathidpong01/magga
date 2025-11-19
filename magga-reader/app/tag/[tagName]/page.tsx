import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Grid, Typography, Box } from "@mui/material";
import MangaCard from "@/app/components/MangaCard";

type TagPageProps = {
  params: {
    tagName: string;
  };
};

export async function generateMetadata({ params }: TagPageProps) {
  const tagName = decodeURIComponent(params.tagName);
  return {
    title: `Tag: ${tagName}`,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const tagName = decodeURIComponent(params.tagName);

  const tag = await prisma.tag.findUnique({
    where: { name: tagName },
    include: {
      mangas: {
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


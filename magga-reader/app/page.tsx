import prisma from "@/lib/prisma";
import { Grid, Typography, Box } from "@mui/material";
import MangaCard from "./components/MangaCard";

export default async function Home() {
  const mangas = await prisma.manga.findMany({
    orderBy: {
      createdAt: 'desc',
    }
  });

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        All Mangas
      </Typography>
      <Grid container spacing={3}>
        {mangas.map((manga) => (
          <Grid item key={manga.id} xs={12} sm={6} md={4} lg={3}>
            <MangaCard manga={manga} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

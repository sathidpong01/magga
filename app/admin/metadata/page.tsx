import prisma from "@/lib/prisma";
import { Grid, Typography, Box } from "@mui/material";
import CategoryManager from "../components/CategoryManager";
import TagManager from "../components/TagManager";

export default async function MetadataPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Classifications
      </Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom>
            Categories
          </Typography>
          <CategoryManager initialCategories={categories} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom>
            Tags
          </Typography>
          <TagManager initialTags={tags} />
        </Grid>
      </Grid>
    </Box>
  );
}

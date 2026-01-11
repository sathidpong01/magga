import { Container, Box, Grid, Skeleton } from "@mui/material";
import MangaCardSkeleton from "./components/features/manga/MangaCardSkeleton";

export default function HomeLoading() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        {/* Search Filters Skeleton */}
        <Box sx={{ mb: 3 }}>
          <Skeleton 
            variant="rectangular" 
            width="100%" 
            height={80}
            sx={{ bgcolor: "rgba(255, 255, 255, 0.05)", borderRadius: 1 }}
          />
        </Box>

        {/* Title Skeleton */}
        <Skeleton 
          variant="text" 
          width={300} 
          height={48}
          sx={{ bgcolor: "rgba(255, 255, 255, 0.05)", mb: 4 }}
        />

        {/* Manga Cards Grid Skeleton */}
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Grid item key={i} xs={6} sm={6} md={4} lg={3}>
              <MangaCardSkeleton />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}

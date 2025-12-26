import { Container, Grid, Skeleton, Box } from "@mui/material";

export default function TagLoading() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        {/* Title Skeleton */}
        <Skeleton
          variant="text"
          width={250}
          height={56}
          sx={{ bgcolor: "rgba(255, 255, 255, 0.05)", mb: 4 }}
        />

        {/* Manga Cards Grid Skeleton */}
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Grid item key={i} xs={6} sm={6} md={4} lg={3}>
              <Skeleton
                variant="rectangular"
                height={400}
                sx={{ bgcolor: "rgba(255, 255, 255, 0.05)", borderRadius: 1 }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}

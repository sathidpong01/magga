"use client";

import { Skeleton, Paper, Box, Grid, Container } from "@mui/material";

export default function MangaReaderSkeleton() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a', pb: 8 }}>
      {/* Hero Section Skeleton */}
      <Box sx={{ position: 'relative', overflow: 'hidden', mb: -4 }}>
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: '#171717' }} />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pt: { xs: 4, md: 6 }, pb: { xs: 4, md: 4 } }}>
          <Grid container spacing={4}>
            {/* Left: Cover Image */}
            <Grid item xs={12} md={4} lg={3} sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <Skeleton 
                variant="rectangular" 
                sx={{ 
                  width: "100%", 
                  maxWidth: { xs: "240px", md: "100%" },
                  aspectRatio: "2/3",
                  borderRadius: 1,
                  bgcolor: "rgba(255, 255, 255, 0.05)"
                }} 
              />
            </Grid>

            {/* Right: Details */}
            <Grid item xs={12} md={8} lg={9} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <Box>
                {/* Category Chip */}
                <Skeleton variant="rounded" width={80} height={28} sx={{ mb: 2, bgcolor: "rgba(251, 191, 36, 0.2)" }} />

                {/* Title */}
                <Skeleton variant="text" width="80%" height={80} sx={{ mb: 1, bgcolor: "rgba(255, 255, 255, 0.1)" }} />

                {/* Author Credits */}
                <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                  <Skeleton variant="rounded" width={100} height={32} sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }} />
                  <Skeleton variant="rounded" width={120} height={32} sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }} />
                </Box>

                {/* Stats */}
                <Box sx={{ display: "flex", gap: 3, mb: 3 }}>
                  <Skeleton variant="text" width={100} height={24} sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }} />
                  <Skeleton variant="text" width={100} height={24} sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }} />
                </Box>

                {/* Description */}
                <Skeleton variant="text" width="100%" height={24} sx={{ mb: 1, bgcolor: "rgba(255, 255, 255, 0.05)" }} />
                <Skeleton variant="text" width="90%" height={24} sx={{ mb: 1, bgcolor: "rgba(255, 255, 255, 0.05)" }} />
                <Skeleton variant="text" width="95%" height={24} sx={{ mb: 4, bgcolor: "rgba(255, 255, 255, 0.05)" }} />

                {/* Tags */}
                <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} variant="rounded" width={80} height={24} sx={{ bgcolor: "rgba(56, 189, 248, 0.1)" }} />
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Pages Skeleton */}
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <Skeleton variant="rectangular" width="100%" height={800} sx={{ maxWidth: "1000px", bgcolor: "rgba(255, 255, 255, 0.05)" }} />
          <Skeleton variant="rectangular" width="100%" height={800} sx={{ maxWidth: "1000px", bgcolor: "rgba(255, 255, 255, 0.05)" }} />
        </Box>
      </Container>
    </Box>
  );
}

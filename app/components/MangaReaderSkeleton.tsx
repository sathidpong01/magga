"use client";

import { Skeleton, Paper, Box, Grid } from "@mui/material";

export default function MangaReaderSkeleton() {
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: { xs: 2, md: 4 }, 
        my: 4,
        backgroundColor: "#171717",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 3,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
      }}
    >
      <Grid container spacing={4}>
        {/* Cover Skeleton */}
        <Grid item xs={12} sm={4}>
          <Skeleton 
            variant="rectangular" 
            width="100%" 
            height={400}
            sx={{ 
              bgcolor: "rgba(255, 255, 255, 0.05)",
              borderRadius: 2 
            }}
          />
        </Grid>

        {/* Details Skeleton */}
        <Grid item xs={12} sm={8}>
          <Skeleton 
            variant="text" 
            width="60%" 
            height={60}
            sx={{ bgcolor: "rgba(255, 255, 255, 0.05)", mb: 2 }}
          />
          <Skeleton 
            variant="text" 
            width="100%" 
            height={24}
            sx={{ bgcolor: "rgba(255, 255, 255, 0.05)", mb: 1 }}
          />
          <Skeleton 
            variant="text" 
            width="90%" 
            height={24}
            sx={{ bgcolor: "rgba(255, 255, 255, 0.05)", mb: 3 }}
          />
          
          {/* Chips Skeleton */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {[1, 2, 3].map((i) => (
              <Skeleton 
                key={i}
                variant="rounded" 
                width={80} 
                height={32}
                sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }}
              />
            ))}
          </Box>
        </Grid>
      </Grid>

      {/* Rating Skeleton */}
      <Box sx={{ mt: 3, display: "flex", alignItems: "center", gap: 2 }}>
        <Skeleton 
          variant="text" 
          width={100} 
          height={40}
          sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }}
        />
        <Skeleton 
          variant="rounded" 
          width={200} 
          height={40}
          sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }}
        />
      </Box>
    </Paper>
  );
}

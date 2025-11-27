"use client";

import { Skeleton, Card, CardContent, Box, Grid } from "@mui/material";

export default function MangaCardSkeleton() {
  return (
    <Card sx={{ 
      height: "100%",
      backgroundColor: "#171717",
      border: "1px solid rgba(255, 255, 255, 0.06)",
      borderRadius: 2,
    }}>
      <Box sx={{ position: "relative", height: 300, width: "100%" }}>
        <Skeleton 
          variant="rectangular" 
          width="100%" 
          height={300}
          sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }}
        />
      </Box>
      <CardContent>
        <Skeleton 
          variant="text" 
          width="80%" 
          height={32}
          sx={{ bgcolor: "rgba(255, 255, 255, 0.05)", mb: 1 }}
        />
        <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
          <Skeleton 
            variant="text" 
            width={60} 
            height={20}
            sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }}
          />
          <Skeleton 
            variant="text" 
            width={60} 
            height={20}
            sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }}
          />
        </Box>
        <Skeleton 
          variant="rounded" 
          width={80} 
          height={22}
          sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }}
        />
      </CardContent>
    </Card>
  );
}

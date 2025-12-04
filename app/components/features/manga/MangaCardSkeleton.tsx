"use client";

import { Skeleton, Card, CardContent, Box } from "@mui/material";

export default function MangaCardSkeleton() {
  return (
    <Card sx={{ 
      height: 400,
      position: "relative",
      borderRadius: 0.8,
      overflow: "hidden",
      bgcolor: "#171717",
      boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
    }}>
      {/* Full height image skeleton */}
      <Skeleton 
        variant="rectangular" 
        width="100%" 
        height="100%"
        sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }}
      />
      
      {/* Overlay Content */}
      <Box sx={{ 
        position: "absolute", 
        bottom: 0, 
        left: 0, 
        right: 0, 
        p: 3,
        background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)"
      }}>
        {/* Category Chip Skeleton */}
        <Skeleton 
          variant="rounded" 
          width={60} 
          height={20} 
          sx={{ mb: 1, bgcolor: "rgba(251, 191, 36, 0.2)" }} 
        />

        {/* Title Skeleton */}
        <Skeleton 
          variant="text" 
          width="90%" 
          height={32} 
          sx={{ mb: 0.5, bgcolor: "rgba(255, 255, 255, 0.1)" }} 
        />
        <Skeleton 
          variant="text" 
          width="60%" 
          height={32} 
          sx={{ mb: 1, bgcolor: "rgba(255, 255, 255, 0.1)" }} 
        />

        {/* Stats Skeleton */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Skeleton 
            variant="text" 
            width={40} 
            height={20} 
            sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }} 
          />
          <Skeleton 
            variant="text" 
            width={60} 
            height={20} 
            sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }} 
          />
        </Box>
      </Box>
    </Card>
  );
}

import { Container, Box } from "@mui/material";
import MangaReaderSkeleton from "@/app/components/features/manga/MangaReaderSkeleton";

export default function MangaLoading() {
  return (
    <Container maxWidth="lg">
      <MangaReaderSkeleton />
      
      {/* Pages Skeleton */}
      <Box sx={{ mt: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
        {[1, 2, 3].map((i) => (
          <Box 
            key={i}
            sx={{ 
              width: "100%",
              height: 400,
              bgcolor: "rgba(255, 255, 255, 0.02)",
              borderRadius: 1
            }}
          />
        ))}
      </Box>
    </Container>
  );
}

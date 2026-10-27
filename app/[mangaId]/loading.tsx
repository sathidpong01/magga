import { Container, Box } from "@mui/material";
import { MangaReaderSkeleton } from "./loading-skeletons";
import { ReaderHeroSkeleton } from "@/app/components/ui/PageSkeletons";
import { maggaColors } from "@/lib/design-tokens";

export default function MangaLoading() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: maggaColors.background, pb: 8 }}>
      <ReaderHeroSkeleton />
      <Container maxWidth="lg" sx={{ mt: 2, px: { xs: 0, lg: 3 } }}><MangaReaderSkeleton /></Container>
    </Box>
  );
}

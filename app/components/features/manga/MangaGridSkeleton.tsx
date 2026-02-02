import { Grid } from "@mui/material";
import MangaCardSkeleton from "./MangaCardSkeleton";

interface MangaGridSkeletonProps {
  count?: number;
}

export default function MangaGridSkeleton({
  count = 12,
}: MangaGridSkeletonProps) {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: count }).map((_, i) => (
        <Grid key={i} size={{ xs: 6, sm: 6, md: 4, lg: 3 }}>
          <MangaCardSkeleton />
        </Grid>
      ))}
    </Grid>
  );
}

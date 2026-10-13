import { Grid } from "@mui/material";
import MangaCardSkeleton from "./MangaCardSkeleton";
import { maggaLayout } from "@/lib/design-tokens";

interface MangaGridSkeletonProps {
  count?: number;
  taxonomy?: boolean;
}

export default function MangaGridSkeleton({
  count = 12,
  taxonomy = false,
}: MangaGridSkeletonProps) {
  return (
    <Grid container spacing={taxonomy ? maggaLayout.taxonomyGrid.spacing : maggaLayout.mangaGrid.spacing}>
      {Array.from({ length: count }).map((_, i) => (
<Grid key={i} size={taxonomy ? maggaLayout.taxonomyGrid.columns : maggaLayout.mangaGrid.columns}>
          <MangaCardSkeleton />
        </Grid>
      ))}
    </Grid>
  );
}

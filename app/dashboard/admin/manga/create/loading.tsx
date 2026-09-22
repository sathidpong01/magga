import { Box, Skeleton, Paper, Stack, Grid } from "@mui/material";
import {
  dashboardSurfaceSx,
  dashboardTokens,
  dashboardRadii,
} from "@/app/components/dashboard/system";

export default function MangaFormLoading() {
  return (
    <Box>
      {/* Header */}
      <Skeleton
        variant="text"
        width={220}
        height={38}
        sx={{ bgcolor: "rgba(255,255,255,0.08)", mb: 3.5, borderRadius: "6px" }}
      />

      {/* Form Container */}
      <Paper sx={{ p: 3, ...dashboardSurfaceSx }}>
        <Stack spacing={3}>
          {/* Basic Info Section */}
          <Box>
            <Skeleton
              variant="text"
              width={150}
              height={26}
              sx={{ bgcolor: "rgba(255,255,255,0.08)", mb: 2, borderRadius: "6px" }}
            />
            <Grid container spacing={2}>
              <Grid size={12}>
                <Skeleton
                  variant="rectangular"
                  height={56}
                  sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: dashboardRadii.field }}
                />
              </Grid>
              <Grid size={12}>
                <Skeleton
                  variant="rectangular"
                  height={120}
                  sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: dashboardRadii.field }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Skeleton
                  variant="rectangular"
                  height={56}
                  sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: dashboardRadii.field }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Skeleton
                  variant="rectangular"
                  height={56}
                  sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: dashboardRadii.field }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Cover Image Section */}
          <Box>
            <Skeleton
              variant="text"
              width={120}
              height={26}
              sx={{ bgcolor: "rgba(255,255,255,0.08)", mb: 2, borderRadius: "6px" }}
            />
            <Skeleton
              variant="rectangular"
              width={180}
              height={240}
              sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "10px" }}
            />
          </Box>

          {/* Pages Section */}
          <Box>
            <Skeleton
              variant="text"
              width={100}
              height={26}
              sx={{ bgcolor: "rgba(255,255,255,0.08)", mb: 2, borderRadius: "6px" }}
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 2,
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.06)",
                    borderRadius: "8px",
                    aspectRatio: "3 / 4",
                  }}
                />
              ))}
            </Box>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}

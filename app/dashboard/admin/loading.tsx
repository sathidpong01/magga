import { Box, Grid, Skeleton, Stack } from "@mui/material";
import { DashboardSurface, dashboardInsetSurfaceSx } from "@/app/components/dashboard/system";

export default function AdminDashboardLoading() {
  return (
    <Box>
      {/* Header Skeleton */}
      <Box sx={{ mb: 2 }}>
        <Skeleton
          variant="text"
          width={130}
          height={16}
          sx={{ bgcolor: "rgba(255,255,255,0.06)", mb: 0.75, borderRadius: "4px" }}
        />
        <Skeleton
          variant="text"
          width={260}
          height={38}
          sx={{ bgcolor: "rgba(255,255,255,0.08)", mb: 0.75, borderRadius: "6px" }}
        />
        <Skeleton
          variant="text"
          width="min(100%, 540px)"
          height={20}
          sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "4px" }}
        />
      </Box>

      {/* KPI Stats Strip Skeleton: Single row on desktop (7 cols) */}
      <Grid container spacing={1.5} columns={{ xs: 12, sm: 12, md: 12, lg: 7 }} sx={{ mb: 2.5 }}>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Grid key={i} size={{ xs: 6, sm: 3, md: 3, lg: 1 }}>
            <DashboardSurface
              sx={{
                p: 1.5,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 78,
              }}
            >
              <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 0.75 }}>
                <Skeleton
                  variant="text"
                  width={55}
                  height={16}
                  sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "4px" }}
                />
                <Skeleton
                  variant="rectangular"
                  width={30}
                  height={30}
                  sx={{ bgcolor: "rgba(255,255,255,0.07)", borderRadius: "8px" }}
                />
              </Stack>
              <Skeleton
                variant="text"
                width={45}
                height={26}
                sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: "4px" }}
              />
            </DashboardSurface>
          </Grid>
        ))}
      </Grid>

      {/* Popular Manga: Side-by-side Top 3 (Left 7) & Top 4-10 (Right 5) */}
      <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
        {/* Left: Top 3 Manga Skeleton */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <DashboardSurface sx={{ p: { xs: 2, md: 2.25 }, height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ mb: 2 }}>
              <Skeleton
                variant="text"
                width={190}
                height={26}
                sx={{ bgcolor: "rgba(255,255,255,0.08)", mb: 0.5, borderRadius: "6px" }}
              />
              <Skeleton
                variant="text"
                width={130}
                height={16}
                sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "4px" }}
              />
            </Box>

            <Grid container spacing={1.5} sx={{ flex: 1, alignItems: "stretch" }}>
              {[1, 2, 3].map((i) => (
                <Grid key={i} size={{ xs: 12, sm: 4 }}>
                  <Box
                    sx={{
                      ...dashboardInsetSurfaceSx,
                      p: 1.25,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: "10px",
                    }}
                  >
                    <Skeleton
                      variant="rectangular"
                      width="100%"
                      sx={{
                        aspectRatio: "3 / 4",
                        maxHeight: { xs: 260, md: 220, xl: 250 },
                        borderRadius: "8px",
                        bgcolor: "rgba(255,255,255,0.06)",
                        mb: 1,
                      }}
                    />
                    <Skeleton
                      variant="text"
                      width="80%"
                      height={20}
                      sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: "4px" }}
                    />
                    <Skeleton
                      variant="text"
                      width={65}
                      height={18}
                      sx={{ bgcolor: "rgba(255,255,255,0.07)", mt: 0.5, borderRadius: "4px" }}
                    />
                    <Skeleton
                      variant="text"
                      width={85}
                      height={14}
                      sx={{ bgcolor: "rgba(255,255,255,0.05)", mt: 0.25, borderRadius: "4px" }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </DashboardSurface>
        </Grid>

        {/* Right: Top 4-10 Manga Skeleton */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <DashboardSurface sx={{ p: { xs: 2, md: 2.25 }, height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ mb: 2 }}>
              <Skeleton
                variant="text"
                width={110}
                height={26}
                sx={{ bgcolor: "rgba(255,255,255,0.08)", mb: 0.5, borderRadius: "6px" }}
              />
              <Skeleton
                variant="text"
                width={150}
                height={16}
                sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "4px" }}
              />
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, flex: 1, justifyContent: "space-between" }}>
              {[4, 5, 6, 7, 8, 9, 10].map((rank) => (
                <Box
                  key={rank}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1.25,
                    px: 1.25,
                    py: 0.65,
                    borderRadius: "8px",
                    ...dashboardInsetSurfaceSx,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flex: 1 }}>
                    <Skeleton
                      variant="text"
                      width={18}
                      height={16}
                      sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "3px" }}
                    />
                    <Skeleton
                      variant="rectangular"
                      width={32}
                      height={42}
                      sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "4px", flexShrink: 0 }}
                    />
                    <Skeleton
                      variant="text"
                      width="55%"
                      height={18}
                      sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: "4px" }}
                    />
                  </Box>
                  <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                    <Skeleton
                      variant="text"
                      width={40}
                      height={16}
                      sx={{ bgcolor: "rgba(255,255,255,0.07)", borderRadius: "3px" }}
                    />
                    <Skeleton
                      variant="text"
                      width={50}
                      height={12}
                      sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "3px" }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </DashboardSurface>
        </Grid>
      </Grid>
    </Box>
  );
}

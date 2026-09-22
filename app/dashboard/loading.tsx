import { Box, Skeleton, Stack } from "@mui/material";
import { DashboardSurface, dashboardRadii } from "@/app/components/dashboard/system";

export default function DashboardLoading() {
  return (
    <Box>
      {/* Header */}
      <Stack spacing={1} sx={{ mb: 4 }}>
        <Skeleton
          variant="text"
          width={220}
          height={40}
          sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: "6px" }}
        />
        <Skeleton
          variant="text"
          width={340}
          height={22}
          sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "4px" }}
        />
      </Stack>

      {/* Header surface stats */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 2.5,
          mb: 4,
        }}
      >
        {[1, 2, 3].map((i) => (
          <DashboardSurface
            key={i}
            sx={{
              p: 2.5,
              minHeight: 140,
            }}
          >
            <Stack spacing={2}>
              <Skeleton
                variant="rectangular"
                width={40}
                height={40}
                sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: dashboardRadii.field }}
              />
              <Skeleton
                variant="text"
                width="60%"
                height={18}
                sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "4px" }}
              />
              <Skeleton
                variant="text"
                width={100}
                height={34}
                sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: "4px" }}
              />
            </Stack>
          </DashboardSurface>
        ))}
      </Box>

      {/* Recent Activity */}
      <DashboardSurface
        sx={{
          p: 3,
        }}
      >
        <Skeleton
          variant="text"
          width={180}
          height={28}
          sx={{ bgcolor: "rgba(255,255,255,0.08)", mb: 2.5, borderRadius: "6px" }}
        />
        <Stack spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Box key={i} sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Skeleton
                variant="circular"
                width={44}
                height={44}
                sx={{ bgcolor: "rgba(255,255,255,0.06)" }}
              />
              <Box sx={{ flex: 1 }}>
                <Skeleton
                  variant="text"
                  width="40%"
                  height={20}
                  sx={{ bgcolor: "rgba(255,255,255,0.08)", mb: 0.5, borderRadius: "4px" }}
                />
                <Skeleton
                  variant="text"
                  width="60%"
                  height={16}
                  sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "4px" }}
                />
              </Box>
            </Box>
          ))}
        </Stack>
      </DashboardSurface>
    </Box>
  );
}

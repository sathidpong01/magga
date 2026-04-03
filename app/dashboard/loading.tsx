import { Box, Skeleton, Stack } from "@mui/material";
import { DashboardSurface } from "@/app/components/dashboard/system";

export default function DashboardLoading() {
  return (
    <Box>
      {/* Header */}
      <Stack spacing={1} sx={{ mb: 4.5 }}>
        <Skeleton
          variant="text"
          width={220}
          height={46}
          sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2 }}
        />
        <Skeleton
          variant="text"
          width={360}
          height={26}
          sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2 }}
        />
      </Stack>

      {/* Header surface */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 3,
          mb: 4,
        }}
      >
        {[1, 2, 3].map((i) => (
          <DashboardSurface
            key={i}
            sx={{
              p: 3,
              minHeight: 148,
            }}
          >
            <Stack spacing={2}>
              <Skeleton
                variant="rectangular"
                width={44}
                height={44}
                sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2 }}
              />
              <Skeleton
                variant="text"
                width="60%"
                sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
              />
              <Skeleton
                variant="text"
                width={100}
                height={38}
                sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2 }}
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
          height={32}
          sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 2.5 }}
        />
        <Stack spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Box key={i} sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Skeleton
                variant="circular"
                width={48}
                height={48}
                sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
              />
              <Box sx={{ flex: 1 }}>
                <Skeleton
                  variant="text"
                  width="40%"
                  sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 0.5 }}
                />
                <Skeleton
                  variant="text"
                  width="60%"
                  sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
                />
              </Box>
            </Box>
          ))}
        </Stack>
      </DashboardSurface>
    </Box>
  );
}

import { Box, Skeleton } from "@mui/material";
import { DashboardSurface } from "@/app/components/dashboard/system";

export default function AdminDashboardLoading() {
  return (
    <Box>
      <Skeleton
        variant="text"
        width={280}
        height={44}
        sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 4.5, borderRadius: 2 }}
      />

      {/* Dashboard Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 3,
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <DashboardSurface
            key={i}
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              minHeight: 158,
            }}
          >
            <Skeleton
              variant="rectangular"
              width={48}
              height={48}
              sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2 }}
            />
            <Skeleton
              variant="text"
              width="70%"
              sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
            />
            <Skeleton
              variant="text"
              width={100}
              height={36}
              sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2 }}
            />
          </DashboardSurface>
        ))}
      </Box>
    </Box>
  );
}

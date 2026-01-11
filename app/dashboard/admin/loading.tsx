import { Box, Skeleton, Paper } from "@mui/material";

export default function AdminDashboardLoading() {
  return (
    <Box sx={{ p: 3 }}>
      <Skeleton
        variant="text"
        width={250}
        height={40}
        sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 4, borderRadius: 1 }}
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
          <Paper
            key={i}
            sx={{
              p: 3,
              bgcolor: "#171717",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 1,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Skeleton
              variant="rectangular"
              width={48}
              height={48}
              sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
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
              sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
            />
          </Paper>
        ))}
      </Box>
    </Box>
  );
}

import { Box, Skeleton, Paper, Stack } from "@mui/material";

export default function DashboardLoading() {
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack spacing={1} sx={{ mb: 4 }}>
        <Skeleton
          variant="text"
          width={200}
          height={40}
          sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
        />
        <Skeleton
          variant="text"
          width={300}
          height={24}
          sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
        />
      </Stack>

      {/* Stats Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 3,
          mb: 4,
        }}
      >
        {[1, 2, 3].map((i) => (
          <Paper
            key={i}
            sx={{
              p: 3,
              bgg: "#171717",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 1,
            }}
          >
            <Stack spacing={2}>
              <Skeleton
                variant="rectangular"
                width={40}
                height={40}
                sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
              />
              <Skeleton
                variant="text"
                width="60%"
                sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
              />
              <Skeleton
                variant="text"
                width={80}
                height={32}
                sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
              />
            </Stack>
          </Paper>
        ))}
      </Box>

      {/* Recent Activity */}
      <Paper
        sx={{
          p: 3,
          bgcolor: "#171717",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 1,
        }}
      >
        <Skeleton
          variant="text"
          width={180}
          height={32}
          sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 2 }}
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
      </Paper>
    </Box>
  );
}

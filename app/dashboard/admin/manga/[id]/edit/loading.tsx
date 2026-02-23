import { Box, Skeleton, Paper, Stack, Grid } from "@mui/material";

export default function MangaEditLoading() {
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Skeleton
        variant="text"
        width={200}
        height={40}
        sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 4, borderRadius: 1 }}
      />

      {/* Form Container */}
      <Paper
        sx={{
          p: 3,
          bgcolor: "#171717",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 1,
        }}
      >
        <Stack spacing={3}>
          {/* Basic Info Section */}
          <Box>
            <Skeleton
              variant="text"
              width={150}
              height={28}
              sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 2, borderRadius: 1 }}
            />
            <Grid container spacing={2}>
<Grid  size={12}>
                <Skeleton
                  variant="rectangular"
                  height={56}
                  sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
                />
              </Grid>
<Grid  size={12}>
                <Skeleton
                  variant="rectangular"
                  height={120}
                  sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
                />
              </Grid>
<Grid   size={{ xs: 12, md: 6 }}>
                <Skeleton
                  variant="rectangular"
                  height={56}
                  sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
                />
              </Grid>
<Grid   size={{ xs: 12, md: 6 }}>
                <Skeleton
                  variant="rectangular"
                  height={56}
                  sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Cover Image Section */}
          <Box>
            <Skeleton
              variant="text"
              width={120}
              height={28}
              sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 2, borderRadius: 1 }}
            />
            <Skeleton
              variant="rectangular"
              height={200}
              sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
            />
          </Box>

          {/* Pages Section */}
          <Box>
            <Skeleton
              variant="text"
              width={100}
              height={28}
              sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 2, borderRadius: 1 }}
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: 2,
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  height={200}
                  sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
                />
              ))}
            </Box>
          </Box>

          {/* Author Credits Section */}
          <Box>
            <Skeleton
              variant="text"
              width={150}
              height={28}
              sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 2, borderRadius: 1 }}
            />
            <Stack spacing={2}>
              {[1, 2].map((i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  height={60}
                  sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
                />
              ))}
            </Stack>
          </Box>

          {/* Action Buttons */}
          <Box
            sx={{ display: "flex", gap: 2, justifyContent: "flex-end", pt: 2 }}
          >
            <Skeleton
              variant="rectangular"
              width={100}
              height={40}
              sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
            />
            <Skeleton
              variant="rectangular"
              width={100}
              height={40}
              sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
            />
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}

import { Box, Skeleton, Paper, Stack, Grid } from "@mui/material";

export default function SubmitPageLoading() {
  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      {/* Header */}
      <Stack spacing={1} sx={{ mb: 4 }}>
        <Skeleton
          variant="text"
          width={250}
          height={40}
          sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
        />
        <Skeleton
          variant="text"
          width={400}
          height={24}
          sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
        />
      </Stack>

      {/* Form */}
      <Paper
        sx={{
          p: 3,
          bgcolor: "#171717",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 1,
        }}
      >
        <Stack spacing={3}>
          {/* Basic Info */}
          <Box>
            <Skeleton
              variant="text"
              width={180}
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

          {/* Upload Sections */}
          <Box>
            <Skeleton
              variant="text"
              width={140}
              height={28}
              sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 2, borderRadius: 1 }}
            />
            <Skeleton
              variant="rectangular"
              height={180}
              sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
            />
          </Box>

          <Box>
            <Skeleton
              variant="text"
              width={120}
              height={28}
              sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 2, borderRadius: 1 }}
            />
            <Skeleton
              variant="rectangular"
              height={180}
              sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
            />
          </Box>

          {/* Submit Button */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 2 }}>
            <Skeleton
              variant="rectangular"
              width={150}
              height={44}
              sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
            />
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}

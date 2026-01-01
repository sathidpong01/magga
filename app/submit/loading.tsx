import { Box, Skeleton, Container, Paper } from "@mui/material";

export default function SubmitLoading() {
  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, bgcolor: "#171717", borderRadius: 1 }}>
        {/* Title skeleton */}
        <Skeleton
          variant="text"
          width="60%"
          height={40}
          sx={{ mb: 3, bgcolor: "rgba(255,255,255,0.08)" }}
        />

        {/* Form fields skeleton */}
        {[1, 2, 3, 4].map((i) => (
          <Box key={i} sx={{ mb: 3 }}>
            <Skeleton
              variant="text"
              width="30%"
              height={20}
              sx={{ mb: 1, bgcolor: "rgba(255,255,255,0.05)" }}
            />
            <Skeleton
              variant="rectangular"
              height={56}
              sx={{ borderRadius: 0.5, bgcolor: "rgba(255,255,255,0.08)" }}
            />
          </Box>
        ))}

        {/* Upload area skeleton */}
        <Skeleton
          variant="rectangular"
          height={200}
          sx={{ borderRadius: 0.5, mb: 3, bgcolor: "rgba(255,255,255,0.05)" }}
        />

        {/* Submit button skeleton */}
        <Skeleton
          variant="rectangular"
          width={120}
          height={42}
          sx={{ borderRadius: 0.5, bgcolor: "rgba(251,191,36,0.2)" }}
        />
      </Paper>
    </Container>
  );
}

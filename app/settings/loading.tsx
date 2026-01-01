import { Container, Grid, Paper, Skeleton, Box } from "@mui/material";

export default function SettingsLoading() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Tabs skeleton */}
        <Grid item xs={12}>
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                width={100}
                height={40}
                sx={{ borderRadius: 0.5, bgcolor: "rgba(255,255,255,0.08)" }}
              />
            ))}
          </Box>
        </Grid>

        {/* Form skeleton */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, bgcolor: "#171717", borderRadius: 1 }}>
            {/* Avatar section */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
              <Skeleton
                variant="circular"
                width={80}
                height={80}
                sx={{ bgcolor: "rgba(255,255,255,0.08)" }}
              />
              <Box>
                <Skeleton
                  variant="text"
                  width={120}
                  height={24}
                  sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
                />
                <Skeleton
                  variant="text"
                  width={80}
                  height={20}
                  sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
                />
              </Box>
            </Box>

            {/* Form fields */}
            {[1, 2, 3].map((i) => (
              <Box key={i} sx={{ mb: 3 }}>
                <Skeleton
                  variant="text"
                  width="25%"
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

            {/* Submit button */}
            <Skeleton
              variant="rectangular"
              width={100}
              height={40}
              sx={{ mt: 2, borderRadius: 0.5, bgcolor: "rgba(56,189,248,0.2)" }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

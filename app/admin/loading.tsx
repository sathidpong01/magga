import { Skeleton, Box, Grid, Card, CardContent } from "@mui/material";

export default function AdminLoading() {
  return (
    <Box>
      {/* Search Bar Skeleton */}
      <Box sx={{ mb: 4 }}>
        <Skeleton 
          variant="rectangular" 
          width={400} 
          height={40}
          sx={{ bgcolor: "rgba(255, 255, 255, 0.05)", borderRadius: 1 }}
        />
      </Box>

      {/* Quick Stats Skeletons */}
      <Skeleton 
        variant="text" 
        width={120} 
        height={32}
        sx={{ bgcolor: "rgba(255, 255, 255, 0.05)", mb: 2 }}
      />
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ 
              borderRadius: 1, 
              boxShadow: "none", 
              border: "1px solid rgba(255, 255, 255, 0.1)", 
              bgcolor: "#171717" 
            }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton 
                  variant="circular" 
                  width={48} 
                  height={48}
                  sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }}
                />
                <Box sx={{ flex: 1 }}>
                  <Skeleton 
                    variant="text" 
                    width={80} 
                    height={20}
                    sx={{ bgcolor: "rgba(255, 255, 255, 0.05)", mb: 0.5 }}
                  />
                  <Skeleton 
                    variant="text" 
                    width={60} 
                    height={32}
                    sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Top Manga Skeletons */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2].map((i) => (
          <Grid item xs={12} md={6} key={i}>
            <Card sx={{ 
              borderRadius: 1, 
              boxShadow: "none", 
              border: "1px solid rgba(255, 255, 255, 0.1)", 
              bgcolor: "#171717",
              overflow: "hidden" 
            }}>
              <Box sx={{ p: 3, borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                <Skeleton 
                  variant="text" 
                  width={180} 
                  height={32}
                  sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }}
                />
              </Box>
              <Box sx={{ p: 2 }}>
                {[1, 2, 3, 4, 5].map((j) => (
                  <Box key={j} sx={{ mb: 1, p: 2 }}>
                    <Skeleton 
                      variant="rectangular" 
                      width="100%" 
                      height={48}
                      sx={{ bgcolor: "rgba(255, 255, 255, 0.05)", borderRadius: 1 }}
                    />
                  </Box>
                ))}
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Table Skeleton */}
      <Card sx={{ 
        borderRadius: 1, 
        boxShadow: "none", 
        border: "1px solid rgba(255, 255, 255, 0.1)", 
        bgcolor: "#171717" 
      }}>
        <Box sx={{ p: 3, borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <Skeleton 
            variant="text" 
            width={150} 
            height={32}
            sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }}
          />
        </Box>
        <Box sx={{ p: 2 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton 
              key={i}
              variant="rectangular" 
              width="100%" 
              height={72}
              sx={{ bgcolor: "rgba(255, 255, 255, 0.05)", mb: 1 }}
            />
          ))}
        </Box>
      </Card>
    </Box>
  );
}

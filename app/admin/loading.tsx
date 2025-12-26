import { Skeleton, Box, Grid, Card, CardContent } from "@mui/material";

export default function AdminLoading() {
  return (
    <Box>
      {/* Section Title */}
      <Skeleton 
        variant="text" 
        width={80} 
        height={32}
        sx={{ bgcolor: "rgba(255, 255, 255, 0.05)", mb: 2 }}
      />

      {/* Row 1: Manga Stats + Classification Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Manga Stats Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            borderRadius: 1, 
            boxShadow: "none", 
            border: "1px solid rgba(255, 255, 255, 0.08)", 
            bgcolor: "#171717",
            p: 1,
          }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Skeleton variant="rounded" width={32} height={32} sx={{ bgcolor: "rgba(251, 191, 36, 0.15)" }} />
                <Skeleton variant="text" width={60} height={24} sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }} />
              </Box>
              <Grid container spacing={2}>
                {[1, 2, 3].map((i) => (
                  <Grid item xs={4} key={i}>
                    <Box sx={{ p: 2, borderRadius: 1, bgcolor: "rgba(255, 255, 255, 0.03)", textAlign: "center" }}>
                      <Skeleton variant="text" width="60%" height={40} sx={{ bgcolor: "rgba(255, 255, 255, 0.05)", mx: "auto" }} />
                      <Skeleton variant="text" width="80%" height={20} sx={{ bgcolor: "rgba(255, 255, 255, 0.03)", mx: "auto" }} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Classification Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            borderRadius: 1, 
            boxShadow: "none", 
            border: "1px solid rgba(255, 255, 255, 0.08)", 
            bgcolor: "#171717",
            p: 1,
          }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Skeleton variant="rounded" width={32} height={32} sx={{ bgcolor: "rgba(167, 139, 250, 0.15)" }} />
                <Skeleton variant="text" width={80} height={24} sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }} />
              </Box>
              <Grid container spacing={2}>
                {[1, 2].map((i) => (
                  <Grid item xs={6} key={i}>
                    <Box sx={{ p: 2, borderRadius: 1, bgcolor: "rgba(255, 255, 255, 0.03)", textAlign: "center" }}>
                      <Skeleton variant="text" width="50%" height={40} sx={{ bgcolor: "rgba(255, 255, 255, 0.05)", mx: "auto" }} />
                      <Skeleton variant="text" width="70%" height={20} sx={{ bgcolor: "rgba(255, 255, 255, 0.03)", mx: "auto" }} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Row 2: Users & Community + Top 10 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Users & Community Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            borderRadius: 1, 
            boxShadow: "none", 
            border: "1px solid rgba(255, 255, 255, 0.08)", 
            bgcolor: "#171717",
            p: 1,
          }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Skeleton variant="rounded" width={32} height={32} sx={{ bgcolor: "rgba(34, 211, 238, 0.15)" }} />
                <Skeleton variant="text" width={100} height={24} sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }} />
              </Box>
              <Grid container spacing={2}>
                {[1, 2, 3].map((i) => (
                  <Grid item xs={4} key={i}>
                    <Box sx={{ p: 2, borderRadius: 1, bgcolor: "rgba(255, 255, 255, 0.03)", textAlign: "center" }}>
                      <Skeleton variant="text" width="60%" height={40} sx={{ bgcolor: "rgba(255, 255, 255, 0.05)", mx: "auto" }} />
                      <Skeleton variant="text" width="80%" height={20} sx={{ bgcolor: "rgba(255, 255, 255, 0.03)", mx: "auto" }} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Top 10 Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            borderRadius: 1, 
            boxShadow: "none", 
            border: "1px solid rgba(255, 255, 255, 0.08)", 
            bgcolor: "#171717",
            p: 1,
          }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Skeleton variant="rounded" width={32} height={32} sx={{ bgcolor: "rgba(239, 68, 68, 0.15)" }} />
                <Skeleton variant="text" width={120} height={24} sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }} />
              </Box>
              <Box sx={{ maxHeight: 180 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.75, px: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Skeleton variant="rounded" width={28} height={20} sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }} />
                      <Skeleton variant="text" width={140} height={20} sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }} />
                    </Box>
                    <Skeleton variant="text" width={60} height={16} sx={{ bgcolor: "rgba(255, 255, 255, 0.03)" }} />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Manga Table */}
      <Card sx={{ 
        borderRadius: 1, 
        boxShadow: "none", 
        border: "1px solid rgba(255, 255, 255, 0.08)", 
        bgcolor: "#171717" 
      }}>
        <Box sx={{ p: 2, borderBottom: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", justifyContent: "space-between" }}>
          <Skeleton variant="text" width={120} height={28} sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }} />
          <Skeleton variant="rounded" width={200} height={36} sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }} />
        </Box>
        <Box sx={{ p: 2 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton 
              key={i}
              variant="rectangular" 
              width="100%" 
              height={64}
              sx={{ bgcolor: "rgba(255, 255, 255, 0.03)", mb: 1, borderRadius: 0.5 }}
            />
          ))}
        </Box>
      </Card>
    </Box>
  );
}

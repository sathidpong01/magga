import { Skeleton, Box, Paper, Grid } from "@mui/material";

export default function DashboardLoading() {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Skeleton variant="text" width={180} height={40} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
        <Skeleton variant="rectangular" width={140} height={40} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }} />
      </Box>

      {/* Submissions Grid */}
      <Grid container spacing={2}>
        {[1, 2, 3, 4].map(i => (
          <Grid item xs={12} key={i}>
            <Paper sx={{ p: 2, bgcolor: '#171717', display: 'flex', gap: 2, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 1 }}>
              {/* Cover */}
              <Skeleton 
                variant="rectangular" 
                width={80} 
                height={120} 
                sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1, flexShrink: 0 }} 
              />
              
              {/* Content */}
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Skeleton variant="text" width={200} height={28} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Skeleton variant="rectangular" width={70} height={24} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2 }} />
                    <Skeleton variant="circular" width={28} height={28} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                    <Skeleton variant="circular" width={28} height={28} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                  </Box>
                </Box>
                <Skeleton variant="text" width={150} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

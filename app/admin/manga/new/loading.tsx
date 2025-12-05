import { Skeleton, Box, Paper, Grid } from "@mui/material";

export default function MangaFormLoading() {
  return (
    <Box>
      {/* Header */}
      <Grid container spacing={3}>
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="text" width={200} height={40} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Skeleton variant="rectangular" width={80} height={36} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={100} height={36} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={120} height={36} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }} />
          </Box>
        </Grid>

        {/* Left Column */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 1, bgcolor: '#171717', minHeight: 500 }}>
            <Skeleton variant="text" width={180} height={28} sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 3 }} />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Skeleton variant="rectangular" width="100%" height={56} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }} />
              <Skeleton variant="rectangular" width="100%" height={56} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }} />
              <Skeleton variant="rectangular" width="100%" height={120} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Skeleton variant="rectangular" width="50%" height={56} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }} />
                <Skeleton variant="rectangular" width="50%" height={56} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }} />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 1, bgcolor: '#171717', height: '100%' }}>
            <Skeleton variant="text" width={120} height={28} sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 3 }} />
            
            {/* Cover */}
            <Skeleton variant="text" width={100} sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 1 }} />
            <Skeleton 
              variant="rectangular" 
              width={200} 
              height={280} 
              sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1, mx: 'auto', mb: 4 }} 
            />

            {/* Pages */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="text" width={100} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
              <Skeleton variant="rectangular" width={100} height={28} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }} />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <Skeleton 
                  key={i} 
                  variant="rectangular" 
                  sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 0.5, paddingTop: '140%' }} 
                />
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

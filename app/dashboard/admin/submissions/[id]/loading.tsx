import { Skeleton, Box, Paper, Grid } from "@mui/material";

export default function SubmissionDetailLoading() {
  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* Header Card */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: '#171717', borderRadius: 1, border: '1px solid rgba(255,255,255,0.08)' }}>
        <Skeleton variant="text" width={120} height={32} sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 2 }} />
        
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
          {/* Cover Thumbnail */}
          <Skeleton 
            variant="rectangular" 
            width={120} 
            height={170} 
            sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1.5, flexShrink: 0 }} 
          />
          
          {/* Title & Meta */}
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width={300} height={48} sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 1 }} />
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Skeleton variant="rectangular" width={80} height={28} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }} />
              <Skeleton variant="text" width={200} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[1, 2, 3].map(i => (
                <Skeleton key={i} variant="rectangular" width={70} height={24} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }} />
              ))}
            </Box>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Skeleton variant="rectangular" width={100} height={40} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1.5 }} />
            <Skeleton variant="rectangular" width={100} height={40} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1.5 }} />
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          {/* Description Card */}
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#171717', borderRadius: 1, border: '1px solid rgba(255,255,255,0.08)' }}>
            <Skeleton variant="text" width={150} height={32} sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 2 }} />
            <Skeleton variant="text" width="100%" sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
            <Skeleton variant="text" width="80%" sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
            <Skeleton variant="text" width="60%" sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
          </Paper>

          {/* Pages Preview */}
          <Paper sx={{ p: 3, bgcolor: '#171717', borderRadius: 1, border: '1px solid rgba(255,255,255,0.08)' }}>
            <Skeleton variant="text" width={180} height={32} sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 3 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 2 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <Skeleton 
                  key={i} 
                  variant="rectangular" 
                  sx={{ 
                    bgcolor: "rgba(255,255,255,0.05)", 
                    borderRadius: 1.5,
                    paddingTop: '140%'
                  }} 
                />
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          {/* Submitter Card */}
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#171717', borderRadius: 1, border: '1px solid rgba(255,255,255,0.08)' }}>
            <Skeleton variant="text" width={100} height={32} sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Skeleton variant="circular" width={56} height={56} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
              <Box>
                <Skeleton variant="text" width={120} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                <Skeleton variant="text" width={150} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
              </Box>
            </Box>
          </Paper>

          {/* Cover Card */}
          <Paper sx={{ p: 3, bgcolor: '#171717', borderRadius: 1, border: '1px solid rgba(255,255,255,0.08)' }}>
            <Skeleton variant="text" width={100} height={32} sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 2 }} />
            <Skeleton 
              variant="rectangular" 
              sx={{ 
                bgcolor: "rgba(255,255,255,0.05)", 
                borderRadius: 1.5,
                paddingTop: '140%'
              }} 
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

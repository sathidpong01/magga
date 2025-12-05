import { Skeleton, Box, Paper, Chip } from "@mui/material";

export default function MetadataLoading() {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Skeleton variant="text" width={280} height={40} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
        <Skeleton variant="rectangular" width={140} height={40} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1.5 }} />
      </Box>

      {/* Main Card */}
      <Paper sx={{ bgcolor: '#171717', borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.08)', p: 1, display: 'flex', gap: 2 }}>
          <Skeleton variant="rectangular" width={120} height={40} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={100} height={40} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }} />
        </Box>

        {/* Search */}
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Skeleton variant="rectangular" width="100%" height={40} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1.5 }} />
        </Box>

        {/* Items Grid */}
        <Box sx={{ p: 3, display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <Skeleton 
              key={i} 
              variant="rectangular" 
              width={80 + Math.random() * 60} 
              height={36} 
              sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 4 }} 
            />
          ))}
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.05)', bgcolor: 'rgba(0,0,0,0.2)' }}>
          <Skeleton variant="text" width={180} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
        </Box>
      </Paper>
    </Box>
  );
}

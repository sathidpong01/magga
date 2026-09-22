import { Skeleton, Box, Paper, Grid } from "@mui/material";
import {
  dashboardSurfaceSx,
  dashboardTokens,
  dashboardRadii,
} from "@/app/components/dashboard/system";

export default function SubmissionDetailLoading() {
  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* Header Card */}
      <Paper sx={{ p: 3, mb: 3, ...dashboardSurfaceSx }}>
        <Skeleton variant="text" width={120} height={28} sx={{ bgcolor: "rgba(255,255,255,0.06)", mb: 2, borderRadius: "4px" }} />
        
        <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start", flexWrap: { xs: "wrap", md: "nowrap" } }}>
          {/* Cover Thumbnail 3:4 */}
          <Skeleton 
            variant="rectangular" 
            width={120} 
            height={160} 
            sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "10px", flexShrink: 0 }} 
          />
          
          {/* Title & Meta */}
          <Box sx={{ flex: 1, minWidth: 240 }}>
            <Skeleton variant="text" width="min(100%, 340px)" height={44} sx={{ bgcolor: "rgba(255,255,255,0.08)", mb: 1, borderRadius: "6px" }} />
            <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
              <Skeleton variant="rectangular" width={80} height={26} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "6px" }} />
              <Skeleton variant="text" width={180} height={20} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              {[1, 2, 3].map(i => (
                <Skeleton key={i} variant="rectangular" width={65} height={24} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: dashboardRadii.badge }} />
              ))}
            </Box>
          </Box>

          {/* Actions */}
          <Box sx={{ display: "flex", gap: 1.5, flexShrink: 0 }}>
            <Skeleton variant="rectangular" width={100} height={40} sx={{ bgcolor: "rgba(255,255,255,0.07)", borderRadius: dashboardRadii.button }} />
            <Skeleton variant="rectangular" width={100} height={40} sx={{ bgcolor: "rgba(255,255,255,0.07)", borderRadius: dashboardRadii.button }} />
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {/* Description Card */}
          <Paper sx={{ p: 3, mb: 3, ...dashboardSurfaceSx }}>
            <Skeleton variant="text" width={150} height={28} sx={{ bgcolor: "rgba(255,255,255,0.08)", mb: 2, borderRadius: "6px" }} />
            <Skeleton variant="text" width="100%" height={20} sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 0.5, borderRadius: "4px" }} />
            <Skeleton variant="text" width="80%" height={20} sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 0.5, borderRadius: "4px" }} />
            <Skeleton variant="text" width="60%" height={20} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
          </Paper>

          {/* Pages Preview */}
          <Paper sx={{ p: 3, ...dashboardSurfaceSx }}>
            <Skeleton variant="text" width={180} height={28} sx={{ bgcolor: "rgba(255,255,255,0.08)", mb: 3, borderRadius: "6px" }} />
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 2 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <Skeleton 
                  key={i} 
                  variant="rectangular" 
                  sx={{ 
                    bgcolor: "rgba(255,255,255,0.06)", 
                    borderRadius: "8px",
                    aspectRatio: "3 / 4",
                  }} 
                />
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid size={{ xs: 12, lg: 4 }}>
          {/* Submitter Card */}
          <Paper sx={{ p: 3, mb: 3, ...dashboardSurfaceSx }}>
            <Skeleton variant="text" width={120} height={28} sx={{ bgcolor: "rgba(255,255,255,0.08)", mb: 2, borderRadius: "6px" }} />
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Skeleton variant="circular" width={52} height={52} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
              <Box>
                <Skeleton variant="text" width={110} height={22} sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: "4px" }} />
                <Skeleton variant="text" width={140} height={18} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
              </Box>
            </Box>
          </Paper>

          {/* Cover Card */}
          <Paper sx={{ p: 3, ...dashboardSurfaceSx }}>
            <Skeleton variant="text" width={100} height={28} sx={{ bgcolor: "rgba(255,255,255,0.08)", mb: 2, borderRadius: "6px" }} />
            <Skeleton 
              variant="rectangular" 
              sx={{ 
                bgcolor: "rgba(255,255,255,0.06)", 
                borderRadius: "10px",
                aspectRatio: "3 / 4",
              }} 
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

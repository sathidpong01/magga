import { Skeleton, Box, Paper, Grid } from "@mui/material";
import { dashboardSurfaceSx, dashboardRadii } from "@/app/components/dashboard/system";

export default function SubmissionsLoading() {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Skeleton variant="text" width={200} height={38} sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: "6px" }} />
        <Skeleton variant="rectangular" width={140} height={38} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: dashboardRadii.button }} />
      </Box>

      {/* Submissions Grid */}
      <Grid container spacing={2}>
        {[1, 2, 3, 4].map((i) => (
          <Grid key={i} size={12}>
            <Paper sx={{ p: 2.5, ...dashboardSurfaceSx, display: "flex", gap: 2.5 }}>
              {/* Cover 3:4 */}
              <Skeleton 
                variant="rectangular" 
                width={75} 
                height={100} 
                sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "8px", flexShrink: 0 }} 
              />
              
              {/* Content */}
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                  <Skeleton variant="text" width={220} height={28} sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: "4px" }} />
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Skeleton variant="rectangular" width={70} height={24} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "6px" }} />
                    <Skeleton variant="rectangular" width={28} height={28} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "6px" }} />
                    <Skeleton variant="rectangular" width={28} height={28} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "6px" }} />
                  </Box>
                </Box>
                <Skeleton variant="text" width={160} height={20} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

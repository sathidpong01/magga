import { Box, Skeleton, Paper } from "@mui/material";
import { dashboardSurfaceSx, dashboardTokens, dashboardRadii } from "@/app/components/dashboard/system";

export default function Loading() {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" width={220} height={38} sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: "6px" }} />
        <Skeleton variant="text" width={320} height={20} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "4px", mt: 0.5 }} />
      </Box>

      <Paper sx={{ p: 3, ...dashboardSurfaceSx }}>
        <Skeleton variant="text" width={180} height={28} sx={{ bgcolor: "rgba(255,255,255,0.08)", mb: 2, borderRadius: "6px" }} />
        <Skeleton variant="rectangular" width="100%" height={120} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: dashboardRadii.field }} />
      </Paper>
    </Box>
  );
}

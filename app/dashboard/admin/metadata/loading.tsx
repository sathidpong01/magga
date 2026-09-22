import { Skeleton, Box, Paper } from "@mui/material";
import {
  dashboardSurfaceSx,
  dashboardTokens,
  dashboardRadii,
} from "@/app/components/dashboard/system";

export default function MetadataLoading() {
  const chipWidths = [90, 110, 80, 120, 95, 105, 85, 115, 100, 125, 90, 105];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Skeleton variant="text" width={240} height={38} sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: "6px" }} />
          <Skeleton variant="text" width={320} height={20} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "4px", mt: 0.5 }} />
        </Box>
        <Skeleton variant="rectangular" width={130} height={38} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: dashboardRadii.button }} />
      </Box>

      {/* Main Card */}
      <Paper sx={{ ...dashboardSurfaceSx, overflow: "hidden" }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: `1px solid ${dashboardTokens.border}`, p: 1.5, display: "flex", gap: 2 }}>
          <Skeleton variant="rectangular" width={110} height={38} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: dashboardRadii.field }} />
          <Skeleton variant="rectangular" width={90} height={38} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: dashboardRadii.field }} />
        </Box>

        {/* Search */}
        <Box sx={{ p: 2, borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
          <Skeleton variant="rectangular" width="100%" height={42} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: dashboardRadii.field }} />
        </Box>

        {/* Items Grid */}
        <Box sx={{ p: 3, display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          {chipWidths.map((w, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              width={w}
              height={34}
              sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: dashboardRadii.badge }}
            />
          ))}
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: `1px solid rgba(255,255,255,0.05)`, bgcolor: "rgba(0,0,0,0.2)" }}>
          <Skeleton variant="text" width={180} height={20} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
        </Box>
      </Paper>
    </Box>
  );
}

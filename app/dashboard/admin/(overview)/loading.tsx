import { Box, Grid, Skeleton, Typography } from "@mui/material";
import { DashboardPageHeader, DashboardStat, DashboardSurface } from "@/app/components/dashboard/system";
import { overviewCardSx, overviewCoverSx, overviewRankSx } from "@/app/components/dashboard/overview-layout";
import { maggaColors } from "@/lib/design-tokens";

export default function AdminDashboardLoading() {
  return (
    <Box data-skeleton="admin-overview" sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <DashboardPageHeader eyebrow="ADMIN WORKSPACE" title="ภาพรวมการดูแลระบบ" sx={{ mb: 0, "& h1": { fontSize: "1.75rem" } }} />
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 }, flexWrap: "wrap", minHeight: 40 }}>
        <Typography variant="body2" sx={{ color: maggaColors.textSecondary }}>งานรอดำเนินการ</Typography>
        {["ฝากลงรอตรวจ", "รายงานคอมเมนต์", "ข้อเสนอ MCP"].map(label => <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 1, minHeight: 40, px: 1.25, borderRadius: 1, bgcolor: maggaColors.surface, border: `1px solid ${maggaColors.border}` }}>
          <Typography variant="body2" sx={{ color: maggaColors.textSecondary }}>{label}</Typography><Skeleton width={10} height={24} />
        </Box>)}
      </Box>
      <Grid data-skeleton-kpis container spacing={1} columns={{ xs: 12, sm: 12, lg: 7 }}>
        {["มังงะทั้งหมด", "ฉบับร่าง", "รายการรอตรวจ", "ผู้ใช้ทั้งหมด", "คอมเมนต์", "หมวดหมู่", "แท็ก"].map((label, index) => <Grid key={label} size={{ xs: index === 6 ? 12 : 6, sm: index >= 4 ? 4 : 3, lg: 1 }}>
          <DashboardStat label={label} value={<Skeleton width={45} height="1.1em" />} icon={<Skeleton variant="rectangular" width={18} height={18} />} compact />
        </Grid>)}
      </Grid>
      <Grid container spacing={1.5} sx={{ alignItems: "flex-start" }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <DashboardSurface sx={{ p: 1.25 }}>
            <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1, mb: 1 }}>
              <Typography component="h2" sx={{ fontWeight: 700, fontSize: "1rem" }}>เรื่องยอดนิยม 3 อันดับแรก</Typography>
              <Typography variant="caption" sx={{ color: maggaColors.textSecondary, whiteSpace: "nowrap" }}>ยอดอ่านสะสม</Typography>
            </Box>
            <Grid container spacing={1.25}>
              {[1, 2, 3].map(rank => <Grid key={rank} size={{ xs: 12, sm: 4 }} sx={{ minWidth: 0 }}>
                <Box sx={overviewCardSx}>
                  <Box sx={overviewCoverSx}><Skeleton variant="rectangular" width="100%" height="100%" sx={{ position: "absolute", inset: 0 }} /></Box>
                  <Box sx={{ height: 20, mt: 0.75 }}><Skeleton width="85%" height={20} /></Box>
                  <Box sx={{ height: 20 }}><Skeleton width={65} height={20} /></Box>
                  <Box sx={{ mt: 0.5, pt: 0.5, borderTop: `1px solid ${maggaColors.border}` }}><Skeleton variant="rectangular" width="100%" height={48} /></Box>
                </Box>
              </Grid>)}
            </Grid>
          </DashboardSurface>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <DashboardSurface sx={{ p: 1.25 }}>
            <Typography component="h2" sx={{ fontWeight: 700, fontSize: "1rem", mb: 1 }}>อันดับ 4–10</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {[4, 5, 6, 7, 8, 9, 10].map(rank => <Box key={rank} sx={overviewRankSx}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, minWidth: 0 }}>
                  <Skeleton width={24} height={18} /><Skeleton variant="rectangular" width={30} height={40} sx={{ flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}><Skeleton width="85%" height={18} /><Skeleton width={65} height={18} /></Box>
                </Box>
                <Box sx={{ width: { xs: 108, sm: 128 }, flexShrink: 0 }}><Skeleton variant="rectangular" width="100%" height={48} /></Box>
              </Box>)}
            </Box>
          </DashboardSurface>
        </Grid>
      </Grid>
    </Box>
  );
}

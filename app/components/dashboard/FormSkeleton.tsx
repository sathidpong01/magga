import { Box, Grid, Skeleton, Stack } from "@mui/material";
import { maggaColors, maggaRadii } from "@/lib/design-tokens";
import { SkeletonLine } from "@/app/components/ui/PageSkeletons";
import { DashboardPageHeader, DashboardSurface } from "./system";

export function FormSkeleton({ mode = "admin", editing = false }: { mode?: "admin" | "submission"; editing?: boolean }) {
  const field = (height = 56) => <Skeleton variant="rectangular" width="100%" height={height} sx={{ borderRadius: `${maggaRadii.md}px` }} />;
  const title = editing ? (mode === "admin" ? "แก้ไขมังงะ" : "แก้ไขรายการฝากลง") : (mode === "admin" ? "สร้างมังงะใหม่" : "ฝากลงมังงะ");
  return <Box data-skeleton="manga-form"><DashboardPageHeader eyebrow={mode === "admin" ? "CONTENT MANAGER" : "SUBMISSION"} title={title} description={mode === "admin" ? "จัดการข้อมูลหลัก ปก เนื้อหา เมทาดาทา และลำดับหน้าของเรื่องให้พร้อมเผยแพร่" : "กรอกข้อมูลเรื่อง ปก หน้าอ่าน และรายละเอียดที่จำเป็นเพื่อส่งให้ทีมตรวจสอบ"}><Box sx={{ display: "flex", gap: 1 }}><SkeletonLine width={80} height={40} /><SkeletonLine width={136} height={40} /></Box></DashboardPageHeader><Grid container spacing={3}>
    <Grid size={{ xs: 12, md: 7 }}><DashboardSurface sx={{ minHeight: 600 }}><Stack spacing={3}>
      <SkeletonLine width={150} height={26} />{field()}{field()}{field(160)}
      <Grid container spacing={3}><Grid size={{ xs: 12, md: 6 }}>{field()}</Grid><Grid size={{ xs: 12, md: 6 }}>{field()}</Grid></Grid>
      {field()}{field(120)}
    </Stack></DashboardSurface></Grid>
    <Grid size={{ xs: 12, md: 5 }}><Stack spacing={3}>
      <Box sx={{ p: 3, bgcolor: maggaColors.surface, borderRadius: `${maggaRadii.card}px` }}><Stack spacing={2}><SkeletonLine width={120} height={26} />{field(220)}</Stack></Box>
      <Box sx={{ p: 3, bgcolor: maggaColors.surface, borderRadius: `${maggaRadii.card}px` }}><Stack spacing={2}><SkeletonLine width={150} height={26} />{field(180)}</Stack></Box>
    </Stack></Grid>
  </Grid></Box>;
}

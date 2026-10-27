import { Box,Grid,Skeleton,Stack,Typography } from "@mui/material";
import { maggaRadii } from "@/lib/design-tokens";
import { DashboardPageHeader,DashboardSurface,DashboardSectionTitle,dashboardTokens } from "./system";
export function FormSkeleton({ mode="admin",editing=false }: { mode?: "admin"|"submission"; editing?: boolean }) {
  const field=(height=56) => <Skeleton variant="rounded" width="100%" height={height} sx={{ borderRadius: `${maggaRadii.md}px` }} />;
  const title=editing? (mode==="admin"? "แก้ไขมังงะ":"แก้ไขรายการฝากลง"):(mode==="admin"? "สร้างมังงะใหม่":"ฝากลงมังงะ");
  return <Box data-skeleton="manga-form" aria-busy>
    <Typography sx={{ mb: 1,color: dashboardTokens.textMuted }}>ข้อมูลพร้อมแก้ไข</Typography>
    <DashboardPageHeader eyebrow={mode==="admin"? "CONTENT MANAGER":"SUBMISSION"} title={title} description={mode==="admin"? "จัดการข้อมูลหลัก ปก เนื้อหา เมทาดาทา และลำดับหน้าของเรื่องให้พร้อมเผยแพร่":"กรอกข้อมูลเรื่อง ปก หน้าอ่าน และรายละเอียดที่จำเป็นเพื่อส่งให้ทีมตรวจสอบ"}>
      <Box sx={{ display: "flex",gap: 1,flexWrap: "wrap" }}>{[80,...(!editing&&mode==="admin"? [160]:[]),136].map((width,i) => <Skeleton key={i} variant="rounded" width={width} height={44} />)}</Box>
    </DashboardPageHeader>
    <Box sx={{ minHeight: 28,mb: 3 }} />
    <Grid container spacing={3}>
      <Grid size={{ xs: 12,lg: 4 }} sx={{ order: { xs: 1,lg: 2 } }}><DashboardSurface sx={{ minHeight: 600 }}>
        <DashboardSectionTitle title="ข้อมูลเรื่อง" description="กรอกชื่อเรื่องและรายละเอียดประกอบภาพก่อนบันทึก" />
        <Stack spacing={3}>{field()}{field()}{field(160)}{field()}{field()}{field(120)}</Stack>
      </DashboardSurface></Grid>
      <Grid size={{ xs: 12,lg: 8 }} sx={{ order: { xs: 2,lg: 1 } }}><DashboardSurface sx={{ height: "100%",minHeight: 600 }}>
        <DashboardSectionTitle title="จัดภาพและลำดับหน้า" description="เพิ่มภาพหน้าอ่าน ตรวจภาพตัวอย่าง และเรียงลำดับก่อนบันทึก" />
        <Stack spacing={2}>{field(44)}{field(220)}{field(44)}</Stack>
      </DashboardSurface></Grid>
    </Grid>
    <Box sx={{ mt: 3,minHeight: 64 }}>{field(64)}</Box>
  </Box>;
}

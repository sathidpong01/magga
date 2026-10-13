import { Box, Grid, Skeleton, Stack } from "@mui/material";
import { DashboardPageHeader, DashboardSurface } from "@/app/components/dashboard/system";
import { SkeletonLine } from "@/app/components/ui/PageSkeletons";
export default function Loading() {
return <Box data-skeleton="my-submissions"><DashboardPageHeader eyebrow="MY SUBMISSIONS" title="รายการฝากลงของฉัน" description="ติดตามสถานะเรื่องที่ส่งเข้ามา แก้ไขรายการที่ยังไม่ผ่าน และเปิดดูเรื่องที่เผยแพร่แล้วได้จากที่เดียว"><SkeletonLine width={166} height={40} /></DashboardPageHeader>
<Grid container spacing={2.5}>{[1,2,3,4].map(i=><Grid key={i} size={{xs:12,md:6}}><DashboardSurface sx={{p:2.5}}><Box sx={{display:"flex",flexDirection:{xs:"column",sm:"row"},gap:2.5}}><Box sx={{width:{xs:"100%",sm:105},height:{xs:200,sm:140},flexShrink:0,borderRadius:"10px",overflow:"hidden"}}><Skeleton variant="rectangular" width="100%" height="100%" /></Box><Stack spacing={1.5} sx={{flex:1,minWidth:0}}><SkeletonLine width="90%" height={24} /><SkeletonLine width="70%" height={20} /><SkeletonLine width={180} height={28} /><SkeletonLine width="80%" height={20} /></Stack></Box></DashboardSurface></Grid>)}</Grid></Box>;
}

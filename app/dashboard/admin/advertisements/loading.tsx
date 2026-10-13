import { Box, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { SkeletonLine } from "@/app/components/ui/PageSkeletons";
import { dashboardTableContainerSx } from "@/app/components/dashboard/system";
import { maggaColors } from "@/lib/design-tokens";
export default function Loading() {
return <Box data-skeleton="advertisements">
<Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center",mb:4,gap:1,flexWrap:"wrap"}}><SkeletonLine width={230} height={41} /><SkeletonLine width={170} height={44} /></Box>
<Box sx={{display:"flex",gap:1.5,flexWrap:"wrap",mb:3}}><Box sx={{flex:"1 1 260px",maxWidth:{xs:"none",md:320}}}><SkeletonLine height={40} /></Box>{[140,145,145].map((w,i)=><SkeletonLine key={i} width={w} height={40} />)}</Box>
<Stack spacing={1.5} sx={{display:{xs:"flex",md:"none"}}}>{[1,2,3].map(i=><Box key={i} sx={{bgcolor:maggaColors.surface,borderColor:maggaColors.border,border:1,borderRadius:"10px",p:1.5,display:"flex",gap:1.5}}><Skeleton variant="rectangular" width={64} height={64} sx={{flexShrink:0}} /><Stack spacing={1} sx={{flex:1,minWidth:0}}><SkeletonLine height={22} /><SkeletonLine width="80%" height={20} /><SkeletonLine width="70%" height={24} /><SkeletonLine width="90%" height={36} /></Stack></Box>)}</Stack>
<TableContainer sx={{...dashboardTableContainerSx,display:{xs:"none",md:"block"}}}><Table><TableHead><TableRow>{["เฟรม","ชื่อ","ประเภท","ตำแหน่ง","เปิดใช้งาน","จัดการ"].map(h=><TableCell key={h} sx={{py:2.5}}><SkeletonLine width={60} height={20} /></TableCell>)}</TableRow></TableHead><TableBody>{[1,2,3,4,5].map(i=><TableRow key={i}>{[60,120,80,90,44,80].map((w,col)=><TableCell key={col} sx={{py:1.5}}><SkeletonLine width={w} height={col===0?60:24} /></TableCell>)}</TableRow>)}</TableBody></Table></TableContainer>
</Box>;
}

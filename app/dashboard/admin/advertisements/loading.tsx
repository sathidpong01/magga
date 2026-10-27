import { Box,Button,MenuItem,Skeleton,Stack,Table,TableBody,TableCell,TableContainer,TableHead,TableRow,TextField,Typography } from "@mui/material";
import { dashboardTableContainerSx,dashboardTokens } from "@/app/components/dashboard/system";
import { advertisementsColumns } from "@/app/components/dashboard/moderation-list-layout";
import { maggaColors } from "@/lib/design-tokens";
export default function Loading() {
  return <Box data-skeleton="advertisements" aria-busy>
    <Box sx={{ display: "flex",justifyContent: "space-between",alignItems: "center",mb: 4,gap: 1,flexWrap: "wrap" }}>
      <Typography variant="h4" sx={{ fontWeight: 900,letterSpacing: "-0.02em",color: dashboardTokens.text }}>จัดการโฆษณา</Typography>
      <Button disabled variant="contained" sx={{ height: 44,px: 3 }}>สร้างโฆษณา</Button>
    </Box>
    <Box sx={{ display: "flex",gap: 1.5,flexWrap: "wrap",mb: 2,minHeight: 56 }}>
      <Skeleton variant="rounded" width={44} height={44} />
      <TextField disabled label="ค้นหาโฆษณา" size="small" sx={{ flex: "1 1 200px" }} />
      {["สถานะ","ตำแหน่ง","อุปกรณ์"].map(label => <TextField key={label} disabled select label={label} value="all" size="small" sx={{ minWidth: 145 }}><MenuItem value="all">{label==="สถานะ"? "ทุกสถานะ":label==="ตำแหน่ง"? "ทุกตำแหน่ง":"ทุกอุปกรณ์"}</MenuItem></TextField>)}
    </Box>
    <Stack spacing={1.5} sx={{ display: { xs: "flex",md: "none" } }}>{Array.from({ length: 20 },(_,i) => <Box key={i} sx={{ bgcolor: maggaColors.surface,borderColor: maggaColors.border,border: 1,borderRadius: "10px",p: 1.5,display: "flex",gap: 1.5 }}><Skeleton variant="rounded" width={64} height={64} sx={{ flexShrink: 0 }} /><Stack spacing={1} sx={{ flex: 1,minWidth: 0 }}><Skeleton height={22} /><Skeleton width="80%" height={20} /><Skeleton width="70%" height={24} /><Skeleton width="90%" height={36} /></Stack></Box>)}</Stack>
    <TableContainer sx={{ ...dashboardTableContainerSx,overflowX: "auto",display: { xs: "none",md: "block" } }}>
      <Table sx={{ tableLayout: "fixed",minWidth: 920 }}><colgroup>{advertisementsColumns.map((width,i) => <col key={i} style={{ width }} />)}</colgroup>
        <TableHead><TableRow>{["เฟรม","ชื่อ","ประเภท","ตำแหน่ง","เปิดใช้งาน","จัดการ"].map(h => <TableCell key={h} sx={{ py: 2.5 }}>{h}</TableCell>)}</TableRow></TableHead>
        <TableBody>{Array.from({ length: 20 },(_,i) => <TableRow key={i}>{[60,"80%",80,90,44,120].map((width,col) => <TableCell key={col} sx={{ py: 1.5 }}><Skeleton variant="rounded" width={width} height={col===0? 60:24} /></TableCell>)}</TableRow>)}</TableBody>
      </Table>
    </TableContainer>
  </Box>;
}

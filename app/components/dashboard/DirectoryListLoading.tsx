"use client";
import { Box,Button,Chip,Paper,Skeleton,Stack,Table,TableBody,TableCell,TableContainer,TableHead,TableRow,Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { adminPageQuery } from "@/lib/admin-pagination";
import DirectoryListHeader from "./DirectoryListHeader";
import DirectoryTableHeader from "./DirectoryTableHeader";
import AdminListControls from "./AdminListControls";
import { directoryColumns,directoryLabels,directoryTableSx,userSorts,userStatuses,type DirectoryKind } from "./directory-list-layout";
import { maggaColors } from "@/lib/design-tokens";
import { dashboardPrimaryButtonSx } from "./system";
export default function DirectoryListLoading({ kind }: { kind: DirectoryKind }) {
  const query=adminPageQuery(Object.fromEntries(useSearchParams().entries()));
  return <Box sx={kind==="users"? { display: "flex",flexDirection: "column",gap: 2.5 }:undefined} aria-busy="true" aria-label="กำลังโหลดรายการ">
    <DirectoryListHeader kind={kind} />
    <AdminListControls query={query} hasMore={false} count={0} loading compactSpacing={kind==="users"} sorts={kind==="users"? userSorts:[]} statuses={kind==="users"? userStatuses:[]} />
    <Paper sx={{ bgcolor: kind==="users"? maggaColors.surfaceMuted:maggaColors.surface,border: `1px solid ${maggaColors.border}`,borderRadius: kind==="users"? "10px":1.25,overflow: "hidden" }}>
      <DirectoryTableHeader kind={kind}>
        {kind==="authors"? <Button disabled sx={dashboardPrimaryButtonSx}>เพิ่มผู้แต่ง</Button>:<Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap",width: { xs: "100%",md: "auto" },alignItems: "center" }}><Typography variant="caption">เฉพาะหน้านี้</Typography>{["แอดมิน","ระงับ","คอมเมนต์","การฝากลง"].map(label => <Chip key={label} label={`${label} …`} sx={{ minWidth: 84 }} />)}</Stack>}
      </DirectoryTableHeader>
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table className="admin-work-table" sx={kind==="users"? { ...directoryTableSx,"@media(min-width:900px)": { ...directoryTableSx["@media(min-width:900px)"],minWidth: 1040 } }:directoryTableSx} aria-label="กำลังโหลดข้อมูล">
          <colgroup>{directoryColumns[kind].map((width,index) => <col key={index} style={{ width }} />)}</colgroup>
          <TableHead><TableRow sx={{ bgcolor: "rgba(0,0,0,0.2)","& th": { color: maggaColors.textSecondary,fontSize: "0.75rem",fontWeight: 600 } }}>{directoryLabels[kind].map((label,index) => <TableCell key={label} align={index===directoryLabels[kind].length-1? "right":"left"}>{label}</TableCell>)}</TableRow></TableHead>
          <TableBody>{Array.from({ length: query.limit },(_,row) => <TableRow key={row}>{directoryLabels[kind].map((label,column) => <TableCell key={label} data-label={label}>
            {column===directoryLabels[kind].length-1? <Box sx={{ display: "flex",justifyContent: "flex-end",gap: 0.5 }}>{[0,1].map(item => <Skeleton key={item} variant="rounded" width={44} height={44} />)}</Box>:<Skeleton variant="rounded" height={column===0? 36:28} width={column===0? "80%":"90%"} />}
          </TableCell>)}</TableRow>)}</TableBody>
        </Table>
      </TableContainer>
    </Paper>
  </Box>;
}

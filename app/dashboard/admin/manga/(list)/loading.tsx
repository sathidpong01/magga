"use client";
import { Box, Paper, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";
import MangaListHeader from "@/app/components/dashboard/MangaListHeader";
import AdminListControls from "@/app/components/dashboard/AdminListControls";
import { mangaColumnWidths, mangaListPageSx, mangaListShellSx, mangaSorts, mangaStatuses, mangaTableSx } from "@/app/components/dashboard/manga-list-layout";
import { adminPageQuery } from "@/lib/admin-pagination";
import { maggaColors, maggaRadii } from "@/lib/design-tokens";

export default function MangaListLoading() {
  const params = useSearchParams();
  const query = adminPageQuery(Object.fromEntries(params.entries()));
  const labels = ["เลือก", "ปก", "ชื่อเรื่อง", "หมวดหมู่", "แท็ก", "สถานะ", "ยอดอ่าน", "จัดการ"];
  return <Box sx={mangaListPageSx} aria-busy="true" aria-label="กำลังโหลดรายการมังงะ">
    <MangaListHeader />
    <AdminListControls query={query} hasMore={false} count={0} sorts={mangaSorts} statuses={mangaStatuses} loading compactSpacing />
    <Box sx={mangaListShellSx}>
      <Box sx={{ mb: 1, minHeight: 56, display: "flex", alignItems: "center", px: 2 }}><Typography sx={{ fontSize: "0.875rem", fontWeight: 600 }}>กำลังโหลดรายการในหน้านี้</Typography></Box>
      <TableContainer component={Paper} sx={{ bgcolor: maggaColors.surfaceMuted, border: `1px solid ${maggaColors.border}`, borderRadius: "10px", backgroundImage: "none", overflowX: "auto" }}>
        <Table className="admin-work-table admin-manga-table" sx={mangaTableSx} aria-label="กำลังโหลดรายการมังงะ">
          <colgroup>{mangaColumnWidths.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>
          <TableHead><TableRow sx={{ bgcolor: "rgba(255,255,255,0.02)", "& th": { color: maggaColors.textSecondary, py: 2, px: 2, borderBottom: `1px solid ${maggaColors.border}`, fontWeight: 600 } }}>{labels.map((label, index) => <TableCell key={label} align={index === 7 ? "right" : "left"}>{index === 0 ? <Skeleton variant="rounded" width={24} height={24} sx={{ mx: "auto" }} /> : label}</TableCell>)}</TableRow></TableHead>
          <TableBody>{Array.from({ length: query.limit }, (_, index) => <TableRow key={index} sx={{ "& td": { py: 2, px: 2, borderBottom: `1px solid ${maggaColors.border}` } }}>
            {labels.map((label, column) => <TableCell key={label} data-label={label}>
              {column === 0 ? <Box sx={{ width: 42, height: 42, display: "grid", placeItems: "center" }}><Skeleton variant="rounded" width={24} height={24} /></Box> : column === 1 ? <Skeleton variant="rounded" width={48} height={64} sx={{ borderRadius: `${maggaRadii.card}px` }} /> : column === 6 ? <Box sx={{ width: "100%", maxWidth: 130, ml: "auto" }}><Skeleton width={70} height={18} /><Skeleton variant="rounded" height={48} /></Box> : column === 7 ? <Box sx={{ display: "flex", justifyContent: "flex-end", gap: "4px" }}>{[0, 1, 2].map(item => <Skeleton key={item} variant="rounded" width={44} height={44} />)}</Box> : <Skeleton variant="rounded" height={24} width={column === 2 ? "80%" : column === 4 ? "90%" : 55} />}
            </TableCell>)}
          </TableRow>)}</TableBody>
        </Table>
      </TableContainer>
    </Box>
  </Box>;
}

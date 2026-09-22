"use client";

import {
  Skeleton,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  dashboardTableContainerSx,
  dashboardTokens,
  dashboardRadii,
} from "@/app/components/dashboard/system";

export default function AdvertisementsLoading() {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Skeleton variant="text" width={200} height={38} sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: "6px" }} />
          <Skeleton variant="text" width={260} height={20} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "4px", mt: 0.5 }} />
        </Box>
        <Skeleton variant="rectangular" width={120} height={38} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: dashboardRadii.button }} />
      </Box>

      {/* Table */}
      <TableContainer sx={dashboardTableContainerSx}>
        <Table>
          <TableHead>
            <TableRow
              sx={{
                "& th": {
                  borderBottom: `1px solid ${dashboardTokens.border}`,
                  bgcolor: "rgba(255,255,255,0.02)",
                  py: 1.75,
                  px: 2,
                },
              }}
            >
              {["รูป", "ชื่อ", "ประเภท", "ตำแหน่ง", "เปิดใช้งาน", "จัดการ"].map((header) => (
                <TableCell key={header}>
                  <Skeleton variant="text" width={60} height={20} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "4px" }} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow
                key={i}
                sx={{
                  "& td": {
                    borderBottom: `1px solid rgba(255,255,255,0.05)`,
                    py: 1.5,
                    px: 2,
                  },
                }}
              >
                <TableCell>
                  <Skeleton variant="rectangular" width={60} height={60} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "8px" }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={120} height={20} sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: "4px" }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rectangular" width={80} height={24} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "6px" }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rectangular" width={90} height={24} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "6px" }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rectangular" width={44} height={24} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: dashboardRadii.badge }} />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                    <Skeleton variant="rectangular" width={32} height={32} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "6px" }} />
                    <Skeleton variant="rectangular" width={32} height={32} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "6px" }} />
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Skeleton variant="rectangular" width={200} height={36} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: dashboardRadii.button }} />
      </Box>
    </Box>
  );
}

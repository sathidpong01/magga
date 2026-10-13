"use client";

import {
  Skeleton,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  dashboardSurfaceSx,
  dashboardTableContainerSx,
  dashboardTokens,
  dashboardRadii,
} from "@/app/components/dashboard/system";

export default function SubmissionsLoading() {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Skeleton variant="text" width={220} height={38} sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: "6px" }} />
          <Skeleton variant="text" width={300} height={20} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "4px", mt: 0.5 }} />
        </Box>
        <Skeleton variant="rectangular" width={120} height={38} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: dashboardRadii.button }} />
      </Box>

      {/* Tabs & Search */}
      <Paper sx={{ mb: 3, ...dashboardSurfaceSx, p: 2 }}>
        <Box sx={{ borderBottom: `1px solid ${dashboardTokens.border}`, pb: 1.5, mb: 2 }}>
          <Box sx={{ display: "flex", gap: 2 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="text" width={80} height={32} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "4px" }} />
            ))}
          </Box>
        </Box>
        <Skeleton variant="rectangular" width="100%" height={42} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: dashboardRadii.field }} />
      </Paper>

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
              {["ปก", "ชื่อเรื่อง", "ผู้ส่ง", "สถานะ", "วันที่", "จัดการ"].map((header) => (
                <TableCell key={header}>
                  <Skeleton variant="text" width={60} height={20} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "4px" }} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
                  <Skeleton variant="rectangular" width={42} height={56} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "6px" }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={160} height={20} sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: "4px" }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={100} height={20} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "4px" }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rectangular" width={70} height={24} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "6px" }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={80} height={20} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "4px" }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rectangular" width={32} height={32} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "6px" }} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Skeleton variant="rectangular" width={220} height={36} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: dashboardRadii.button }} />
      </Box>
    </Box>
  );
}

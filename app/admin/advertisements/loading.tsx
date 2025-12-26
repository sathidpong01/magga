import { Skeleton, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";

export default function AdvertisementsLoading() {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Skeleton variant="text" width={160} height={40} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
        <Skeleton variant="rectangular" width={120} height={36} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }} />
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ bgcolor: "#171717", borderRadius: 1 }}>
        <Table>
          <TableHead>
            <TableRow>
              {["รูป", "ชื่อ", "ประเภท", "ตำแหน่ง", "เปิดใช้งาน", "จัดการ"].map(header => (
                <TableCell key={header}>
                  <Skeleton variant="text" width={60} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2, 3, 4, 5].map(i => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton variant="rectangular" width={60} height={60} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 0.5 }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={100} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rectangular" width={80} height={24} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2 }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rectangular" width={90} height={24} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2 }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rectangular" width={50} height={24} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 4 }} />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Skeleton variant="circular" width={32} height={32} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                    <Skeleton variant="circular" width={32} height={32} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Skeleton variant="rectangular" width={200} height={32} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }} />
      </Box>
    </Box>
  );
}

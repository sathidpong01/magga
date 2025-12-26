import { Skeleton, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";

export default function CategoriesLoading() {
  return (
    <Box>
      {/* Title */}
      <Skeleton variant="text" width={220} height={40} sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 3 }} />

      {/* Add Button */}
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="rectangular" width={140} height={36} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }} />
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ bgcolor: "#171717", borderRadius: 1 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><Skeleton variant="text" width={80} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} /></TableCell>
              <TableCell align="right"><Skeleton variant="text" width={60} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} /></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton variant="text" width={120} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                    <Skeleton variant="circular" width={32} height={32} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                    <Skeleton variant="circular" width={32} height={32} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

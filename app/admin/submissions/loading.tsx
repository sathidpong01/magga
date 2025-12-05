import { Skeleton, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";

export default function SubmissionsLoading() {
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Skeleton variant="text" width={200} height={40} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
        <Skeleton variant="rectangular" width={100} height={36} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }} />
      </Box>

      {/* Tabs & Search */}
      <Paper sx={{ mb: 3, bgcolor: '#171717', borderRadius: 1 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 1 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} variant="text" width={80} height={36} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
            ))}
          </Box>
        </Box>
        <Box sx={{ p: 2 }}>
          <Skeleton variant="rectangular" width="100%" height={40} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }} />
        </Box>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} sx={{ bgcolor: '#171717', borderRadius: 1 }}>
        <Table>
          <TableHead>
            <TableRow>
              {['Cover', 'Title', 'Submitter', 'Status', 'Date', 'Actions'].map(header => (
                <TableCell key={header}>
                  <Skeleton variant="text" width={60} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton variant="rectangular" width={40} height={60} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 0.5 }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={150} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={100} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rectangular" width={70} height={24} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2 }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={80} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="circular" width={32} height={32} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
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

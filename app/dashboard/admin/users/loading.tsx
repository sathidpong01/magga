import {
  Box,
  Skeleton,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";

export default function UsersLoading() {
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Skeleton
          variant="text"
          width={200}
          height={40}
          sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
        />
        <Skeleton
          variant="rectangular"
          width={200}
          height={36}
          sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
        />
      </Box>

      {/* Table */}
      <TableContainer
        component={Paper}
        sx={{ bgcolor: "#0a0a0a", borderRadius: 1 }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ "& th": { borderBottom: "1px solid #262626" } }}>
              {[
                "ผู้ใช้",
                "อีเมล",
                "Role",
                "สถานะ",
                "วันที่สมัคร",
                "จัดการ",
              ].map((header) => (
                <TableCell key={header}>
                  <Skeleton
                    variant="text"
                    width={80}
                    sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
                  />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <TableRow
                key={i}
                sx={{ "& td": { borderBottom: "1px solid #262626" } }}
              >
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Skeleton
                      variant="circular"
                      width={40}
                      height={40}
                      sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
                    />
                    <Skeleton
                      variant="text"
                      width={120}
                      sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Skeleton
                    variant="text"
                    width={150}
                    sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
                  />
                </TableCell>
                <TableCell>
                  <Skeleton
                    variant="rectangular"
                    width={70}
                    height={24}
                    sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell>
                  <Skeleton
                    variant="rectangular"
                    width={80}
                    height={24}
                    sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell>
                  <Skeleton
                    variant="text"
                    width={100}
                    sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Skeleton
                      variant="circular"
                      width={32}
                      height={32}
                      sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
                    />
                    <Skeleton
                      variant="circular"
                      width={32}
                      height={32}
                      sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
                    />
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

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

export default function MangaListLoading() {
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
          width={220}
          height={40}
          sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
        />
        <Skeleton
          variant="rectangular"
          width={160}
          height={40}
          sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
        />
      </Box>

      {/* Search & Count */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Skeleton
          variant="rectangular"
          width={300}
          height={40}
          sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
        />
        <Skeleton
          variant="text"
          width={100}
          height={24}
          sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
        />
      </Box>

      {/* Manga Table */}
      <TableContainer
        component={Paper}
        sx={{ bgcolor: "#0a0a0a", borderRadius: 1 }}
      >
        <Table>
          <TableHead>
            <TableRow
              sx={{
                "& th": { borderBottom: "1px solid #262626", py: 2, px: 2 },
              }}
            >
              {[
                "",
                "ปก",
                "ชื่อเรื่อง",
                "หมวดหมู่",
                "แท็ก",
                "สถานะ",
                "ผู้ชม",
                "จัดการ",
              ].map((header) => (
                <TableCell key={header}>
                  <Skeleton
                    variant="text"
                    width={header === "" || header === "ปก" ? 40 : 80}
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
                sx={{
                  "& td": { borderBottom: "1px solid #262626", py: 2, px: 2 },
                }}
              >
                <TableCell>
                  <Skeleton
                    variant="rectangular"
                    width={18}
                    height={18}
                    sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
                  />
                </TableCell>
                <TableCell>
                  <Skeleton
                    variant="rectangular"
                    width={40}
                    height={56}
                    sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell>
                  <Skeleton
                    variant="text"
                    width={200}
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
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Skeleton
                      variant="rectangular"
                      width={60}
                      height={24}
                      sx={{
                        bgcolor: "rgba(255,255,255,0.05)",
                        borderRadius: 1,
                      }}
                    />
                    <Skeleton
                      variant="rectangular"
                      width={60}
                      height={24}
                      sx={{
                        bgcolor: "rgba(255,255,255,0.05)",
                        borderRadius: 1,
                      }}
                    />
                    <Skeleton
                      variant="rectangular"
                      width={60}
                      height={24}
                      sx={{
                        bgcolor: "rgba(255,255,255,0.05)",
                        borderRadius: 1,
                      }}
                    />
                  </Box>
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
                    variant="text"
                    width={60}
                    sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    {[1, 2, 3, 4, 5].map((j) => (
                      <Skeleton
                        key={j}
                        variant="circular"
                        width={32}
                        height={32}
                        sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
                      />
                    ))}
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

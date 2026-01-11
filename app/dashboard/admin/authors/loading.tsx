import {
  Box,
  Skeleton,
  Paper,
  Stack,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";

export default function AuthorsLoading() {
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
          width={100}
          height={40}
          sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
        />
      </Box>

      {/* Add New Author Form */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          bgcolor: "#171717",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 1,
        }}
      >
        <Skeleton
          variant="text"
          width={180}
          height={28}
          sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 2, borderRadius: 1 }}
        />

        <Stack spacing={2}>
          {/* Name Field */}
          <Box>
            <Skeleton
              variant="text"
              width={80}
              height={20}
              sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 1 }}
            />
            <Skeleton
              variant="rectangular"
              height={56}
              sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
            />
          </Box>

          {/* Social Media Section */}
          <Box>
            <Skeleton
              variant="text"
              width={150}
              height={20}
              sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 1 }}
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr auto",
                gap: 1,
                alignItems: "center",
                mb: 1,
              }}
            >
              <Skeleton
                variant="rectangular"
                height={48}
                sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
              />
              <Skeleton
                variant="rectangular"
                height={48}
                width={150}
                sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
              />
              <Skeleton
                variant="rectangular"
                height={48}
                sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
              />
              <Skeleton
                variant="circular"
                width={32}
                height={32}
                sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
              />
            </Box>
            <Skeleton
              variant="text"
              width={150}
              height={32}
              sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
            />
          </Box>
        </Stack>
      </Paper>

      {/* Authors Table */}
      <Paper
        sx={{
          bgcolor: "#171717",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 1,
        }}
      >
        <Box sx={{ p: 2, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Skeleton
            variant="text"
            width={150}
            height={28}
            sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ "& th": { borderBottom: "1px solid #262626" } }}>
                {["ชื่อ", "ช่องทาง Social", "จัดการ"].map((header) => (
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
                    <Skeleton
                      variant="text"
                      width={120}
                      sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {[1, 2, 3].map((j) => (
                        <Skeleton
                          key={j}
                          variant="rectangular"
                          width={90}
                          height={24}
                          sx={{
                            bgcolor: "rgba(255,255,255,0.05)",
                            borderRadius: 1,
                          }}
                        />
                      ))}
                    </Box>
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
      </Paper>
    </Box>
  );
}

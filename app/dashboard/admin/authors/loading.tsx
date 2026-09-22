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
import {
  dashboardSurfaceSx,
  dashboardTokens,
  dashboardRadii,
} from "@/app/components/dashboard/system";

export default function AuthorsLoading() {
  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Skeleton
            variant="text"
            width={200}
            height={38}
            sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: "6px" }}
          />
          <Skeleton
            variant="text"
            width={280}
            height={20}
            sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "4px", mt: 0.5 }}
          />
        </Box>
        <Skeleton
          variant="rectangular"
          width={100}
          height={38}
          sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: dashboardRadii.button }}
        />
      </Box>

      {/* Add New Author Form */}
      <Paper sx={{ p: 3, mb: 3, ...dashboardSurfaceSx }}>
        <Skeleton
          variant="text"
          width={180}
          height={28}
          sx={{ bgcolor: "rgba(255,255,255,0.08)", mb: 2, borderRadius: "6px" }}
        />

        <Stack spacing={2}>
          {/* Name Field */}
          <Box>
            <Skeleton
              variant="text"
              width={80}
              height={20}
              sx={{ bgcolor: "rgba(255,255,255,0.06)", mb: 1 }}
            />
            <Skeleton
              variant="rectangular"
              height={48}
              sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: dashboardRadii.field }}
            />
          </Box>

          {/* Social Media Section */}
          <Box>
            <Skeleton
              variant="text"
              width={150}
              height={20}
              sx={{ bgcolor: "rgba(255,255,255,0.06)", mb: 1 }}
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr auto",
                gap: 1.5,
                alignItems: "center",
                mb: 1,
              }}
            >
              <Skeleton
                variant="rectangular"
                height={42}
                sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: dashboardRadii.field }}
              />
              <Skeleton
                variant="rectangular"
                height={42}
                width={150}
                sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: dashboardRadii.field }}
              />
              <Skeleton
                variant="rectangular"
                height={42}
                sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: dashboardRadii.field }}
              />
              <Skeleton
                variant="circular"
                width={32}
                height={32}
                sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
              />
            </Box>
          </Box>
        </Stack>
      </Paper>

      {/* Authors Table */}
      <Paper sx={{ ...dashboardSurfaceSx, overflow: "hidden" }}>
        <Box sx={{ p: 2, borderBottom: `1px solid ${dashboardTokens.border}` }}>
          <Skeleton
            variant="text"
            width={150}
            height={28}
            sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: "6px" }}
          />
        </Box>

        <TableContainer>
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
                {["ชื่อ", "ช่องทาง Social", "จัดการ"].map((header) => (
                  <TableCell key={header}>
                    <Skeleton
                      variant="text"
                      width={80}
                      height={20}
                      sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "4px" }}
                    />
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
                    <Skeleton
                      variant="text"
                      width={120}
                      height={20}
                      sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: "4px" }}
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
                            borderRadius: dashboardRadii.badge,
                          }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                      <Skeleton
                        variant="rectangular"
                        width={32}
                        height={32}
                        sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "6px" }}
                      />
                      <Skeleton
                        variant="rectangular"
                        width={32}
                        height={32}
                        sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "6px" }}
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

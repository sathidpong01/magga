"use client";

import {
  Box,
  Skeleton,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import {
  dashboardTableContainerSx,
  dashboardTokens,
  dashboardRadii,
} from "@/app/components/dashboard/system";

export default function UsersLoading() {
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
          width={180}
          height={40}
          sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: dashboardRadii.field }}
        />
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
                    width={70}
                    height={20}
                    sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "4px" }}
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
                  "& td": {
                    borderBottom: `1px solid rgba(255,255,255,0.05)`,
                    py: 1.5,
                    px: 2,
                  },
                }}
              >
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Skeleton
                      variant="circular"
                      width={38}
                      height={38}
                      sx={{ bgcolor: "rgba(255,255,255,0.06)" }}
                    />
                    <Skeleton
                      variant="text"
                      width={120}
                      height={20}
                      sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: "4px" }}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Skeleton
                    variant="text"
                    width={140}
                    height={20}
                    sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "4px" }}
                  />
                </TableCell>
                <TableCell>
                  <Skeleton
                    variant="rectangular"
                    width={64}
                    height={24}
                    sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "6px" }}
                  />
                </TableCell>
                <TableCell>
                  <Skeleton
                    variant="rectangular"
                    width={72}
                    height={24}
                    sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "6px" }}
                  />
                </TableCell>
                <TableCell>
                  <Skeleton
                    variant="text"
                    width={90}
                    height={20}
                    sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "4px" }}
                  />
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
    </Box>
  );
}

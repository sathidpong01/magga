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

export default function MangaListLoading() {
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
            width={240}
            height={38}
            sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: "6px" }}
          />
          <Skeleton
            variant="text"
            width={320}
            height={20}
            sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "4px", mt: 0.5 }}
          />
        </Box>
        <Skeleton
          variant="rectangular"
          width={150}
          height={40}
          sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: dashboardRadii.button }}
        />
      </Box>

      {/* Search & Action Bar */}
      <Box
        sx={{
          mb: 2.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Skeleton
          variant="rectangular"
          width={320}
          height={42}
          sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: dashboardRadii.field }}
        />
        <Skeleton
          variant="text"
          width={110}
          height={24}
          sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "4px" }}
        />
      </Box>

      {/* Manga Table */}
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
                    width={header === "" || header === "ปก" ? 36 : 70}
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
                  <Skeleton
                    variant="rectangular"
                    width={18}
                    height={18}
                    sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "4px" }}
                  />
                </TableCell>
                <TableCell>
                  <Skeleton
                    variant="rectangular"
                    width={42}
                    height={56}
                    sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "6px" }}
                  />
                </TableCell>
                <TableCell>
                  <Skeleton
                    variant="text"
                    width="min(240px, 80%)"
                    height={22}
                    sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: "4px" }}
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
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Skeleton
                      variant="rectangular"
                      width={55}
                      height={24}
                      sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "6px" }}
                    />
                    <Skeleton
                      variant="rectangular"
                      width={55}
                      height={24}
                      sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "6px" }}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Skeleton
                    variant="rectangular"
                    width={68}
                    height={24}
                    sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "6px" }}
                  />
                </TableCell>
                <TableCell>
                  <Skeleton
                    variant="text"
                    width={50}
                    height={20}
                    sx={{ bgcolor: "rgba(255,255,255,0.07)", borderRadius: "4px" }}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                    {[1, 2, 3].map((j) => (
                      <Skeleton
                        key={j}
                        variant="rectangular"
                        width={30}
                        height={30}
                        sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "6px" }}
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

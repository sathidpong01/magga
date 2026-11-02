"use client";
import {
  Box,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import MangaListHeader from "@/app/components/dashboard/MangaListHeader";
import MangaListControls from "../MangaListControls";
import {
  mangaCollectionSx,
  mangaColumnWidths,
  mangaCompactRowSx,
  mangaCompactSx,
  mangaListPageSx,
  mangaTableSx,
  mangaWideSx,
} from "@/app/components/dashboard/manga-list-layout";
import { adminPageQuery } from "@/lib/admin-pagination";
import { maggaColors, maggaRadii } from "@/lib/design-tokens";

export default function MangaListLoading() {
  const params = useSearchParams();
  const query = adminPageQuery(Object.fromEntries(params.entries()));
  return (
    <Box
      sx={mangaListPageSx}
      aria-busy="true"
      aria-label="กำลังโหลดรายการมังงะ"
    >
      <MangaListHeader />
      <MangaListControls query={query} hasMore={false} count={0} loading />
      <Box
        sx={{
          ...mangaCollectionSx,
          border: `1px solid ${maggaColors.border}`,
          borderRadius: "12px",
          bgcolor: maggaColors.surface,
        }}
      >
        <Stack
          direction="row"
          sx={{
            minHeight: 60,
            px: 1.5,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Skeleton width={110} />
          <Skeleton width={100} height={44} />
        </Stack>
        <Box sx={mangaCompactSx}>
          {Array.from({ length: query.limit }, (_, index) => (
            <Box key={index} sx={mangaCompactRowSx}>
              <Stack direction="row" spacing={1.5}>
                <Skeleton
                  variant="rounded"
                  width={60}
                  height={80}
                  sx={{ flexShrink: 0, borderRadius: `${maggaRadii.card}px` }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Skeleton width="85%" height={28} />
                  <Skeleton width="55%" height={24.5} />
                  <Skeleton
                    variant="rounded"
                    width={100}
                    height={24}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Stack>
              <Stack
                direction="row"
                spacing={0.5}
                sx={{ alignItems: "center", minHeight: 44, mt: 0.5 }}
              >
                <Skeleton variant="rounded" width={48} height={24} />
                <Skeleton variant="rounded" width={64} height={24} />
                <Skeleton width={70} height={24} />
              </Stack>
              <Stack
                direction="row"
                sx={{
                  justifyContent: "space-between",
                  alignItems: "center",
                  minHeight: 44,
                }}
              >
                <Skeleton width={80} height={42} />
                <Skeleton width={112} height={44} />
              </Stack>
            </Box>
          ))}
        </Box>
        <Box sx={mangaWideSx}>
          <Table
            sx={{
              ...mangaTableSx,
              borderTop: `1px solid ${maggaColors.border}`,
              "& th, & td": {
                px: 1,
                py: 1.5,
                borderBottom: `1px solid ${maggaColors.border}`,
              },
            }}
            aria-label="กำลังโหลดรายการมังงะ"
          >
            <colgroup>
              {mangaColumnWidths.map((width, index) => (
                <col key={index} style={{ width }} />
              ))}
            </colgroup>
            <TableHead>
              <TableRow>
                {[
                  "เลือก",
                  "ปก",
                  "ชื่อเรื่อง",
                  "หมวดหมู่",
                  "แท็ก",
                  "สถานะ",
                  "ยอดอ่าน",
                  "จัดการ",
                ].map((label) => (
                  <TableCell
                    key={label}
                    sx={{ color: maggaColors.textSecondary, fontWeight: 600 }}
                  >
                    {label === "เลือก" ? null : label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from({ length: query.limit }, (_, index) => (
                <TableRow key={index}>
                  <TableCell />
                  <TableCell>
                    <Skeleton
                      variant="rounded"
                      width={48}
                      height={64}
                      sx={{ borderRadius: `${maggaRadii.card}px` }}
                    />
                  </TableCell>
                  {[0, 1, 2, 3, 4, 5].map((column) => (
                    <TableCell key={column}>
                      <Skeleton width="80%" height={column === 4 ? 48 : 24} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>
      <MangaListControls
        query={query}
        hasMore={false}
        count={0}
        loading
        pagination
      />
    </Box>
  );
}

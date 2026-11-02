"use client";
import { Button, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { dashboardTokens, dashboardPrimaryButtonSx } from "./system";
export default function MangaListHeader() {
  return (
    <Stack
      direction="row"
      useFlexGap
      spacing={1}
      sx={{
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        minHeight: 52,
      }}
    >
      <Typography
        component="h1"
        variant="h5"
        sx={{ fontWeight: 700, color: dashboardTokens.text }}
      >
        จัดการมังงะ
      </Typography>
      <Button
        component={Link}
        href="/dashboard/admin/manga/create"
        prefetch={false}
        sx={{ ...dashboardPrimaryButtonSx, minHeight: 44 }}
      >
        + เพิ่มมังงะ
      </Button>
    </Stack>
  );
}

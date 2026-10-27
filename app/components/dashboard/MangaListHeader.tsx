"use client";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { DashboardSurface, dashboardTokens, dashboardPrimaryButtonSx } from "./system";
export default function MangaListHeader({ count }: { count?: number }) {
  return <DashboardSurface sx={{ p: { xs: 2.25, md: 3 } }}>
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" } }}>
      <Box sx={{ maxWidth: 720 }}>
        <Typography variant="overline" sx={{ color: dashboardTokens.accentStrong, fontWeight: 800, letterSpacing: "0.14em", display: "block", mb: 0.5 }}>DASHBOARD / MANGA</Typography>
        <Typography component="h1" variant="h4" sx={{ fontWeight: 900, letterSpacing: "-0.03em", color: dashboardTokens.text, mb: 0.75, fontSize: { xs: "1.8rem", md: "2.25rem" } }}>จัดการมังงะ</Typography>
        <Typography sx={{ color: dashboardTokens.textMuted, lineHeight: 1.7 }}>ค้นหาและจัดการมังงะ แก้ไขข้อมูลหรือสถานะได้จากรายการนี้</Typography>
      </Box>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", alignItems: "center" }}>
        <Chip label={`ในหน้านี้ ${count ?? "…"}`} sx={{ minWidth: 86, bgcolor: dashboardTokens.surfaceMuted, color: dashboardTokens.text, border: `1px solid ${dashboardTokens.border}`, fontWeight: 700 }} />
        <Button component={Link} href="/dashboard/admin/manga/create" prefetch={false} sx={dashboardPrimaryButtonSx}>+ เพิ่มมังงะใหม่</Button>
      </Stack>
    </Stack>
  </DashboardSurface>;
}

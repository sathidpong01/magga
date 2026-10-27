"use client";
import { Box,Chip,Stack,Typography } from "@mui/material";
import { DashboardSurface,dashboardTokens } from "./system";
import type { DirectoryKind } from "./directory-list-layout";
export default function DirectoryListHeader({ kind,count }: { kind: DirectoryKind; count?: number }) {
  const content=<Stack direction={{ xs: "column",md: "row" }} spacing={2} sx={{ justifyContent: "space-between",alignItems: { xs: "flex-start",md: "center" } }}>
    <Box sx={{ maxWidth: 720 }}>
      {kind==="users"&&<Typography variant="overline" sx={{ display: "block",mb: 0.5,color: dashboardTokens.accentStrong,fontWeight: 800,letterSpacing: "0.14em" }}>DASHBOARD / USERS</Typography>}
      <Typography component="h1" variant="h4" sx={{ fontWeight: 900,letterSpacing: "-0.03em",color: dashboardTokens.text,mb: 0.75,fontSize: { xs: "1.8rem",md: "2.25rem" } }}>{kind==="authors"? "จัดการผู้แต่ง":"จัดการผู้ใช้"}</Typography>
      <Typography sx={{ color: dashboardTokens.textMuted,lineHeight: 1.7 }}>{kind==="authors"? "ดู เพิ่ม แก้ไข และลบข้อมูลผู้แต่ง พร้อมจัดการช่องทางติดต่อ":"ดูสถานะผู้ใช้ จัดการบทบาทและการระงับบัญชี พร้อมสถิติในหน้านี้"}</Typography>
    </Box>
    {kind==="users"&&<Chip label={`ในหน้านี้ ${count??"…"}`} sx={{ minWidth: 86,bgcolor: dashboardTokens.surfaceMuted,color: dashboardTokens.text,border: `1px solid ${dashboardTokens.border}`,fontWeight: 700 }} />}
  </Stack>;
  return kind==="users"? <DashboardSurface sx={{ p: { xs: 2.25,md: 3 } }}>{content}</DashboardSurface>:<Box sx={{ mb: 3 }}>{content}</Box>;
}

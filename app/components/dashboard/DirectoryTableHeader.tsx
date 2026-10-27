import type { ReactNode } from "react";
import { Box,Typography } from "@mui/material";
import { dashboardTokens } from "./system";
import type { DirectoryKind } from "./directory-list-layout";
export default function DirectoryTableHeader({ kind,count,children }: { kind: DirectoryKind; count?: number; children?: ReactNode }) {
  return <Box sx={{ px: { xs: 2,md: 3 },py: 2,borderBottom: `1px solid ${dashboardTokens.border}`,bgcolor: "rgba(255,255,255,0.02)",display: "flex",alignItems: "center",justifyContent: "space-between",flexWrap: "wrap",gap: 1 }}>
    <Typography component="h2" variant="subtitle1" sx={{ fontSize: "0.85rem",fontWeight: 800,color: dashboardTokens.text }}>{kind==="authors"? "รายชื่อผู้แต่ง":"รายชื่อผู้ใช้"} ({count??"…"})</Typography>
    {children}
  </Box>;
}

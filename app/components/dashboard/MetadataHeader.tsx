import { Stack,Typography } from "@mui/material";
import { dashboardTokens } from "./system";
export default function MetadataHeader() {
  return (<Stack spacing={0.75} sx={{ mb: 3 }}>
    <Typography
      variant="overline"
      sx={{
        color: dashboardTokens.accent,
        fontWeight: 800,
        letterSpacing: "0.18em",
        lineHeight: 1,
      }}
    >
      WORKSPACE
    </Typography>
    <Typography
      variant="h4"
      component="h1"
      sx={{
        color: dashboardTokens.text,
        fontWeight: 900,
        letterSpacing: "-0.03em",
      }}
    >
      จัดการเมตาดาต้า
    </Typography>
    <Typography sx={{ color: dashboardTokens.textMuted,maxWidth: 720 }}>
      จัดระเบียบหมวดหมู่และแท็กจากพื้นที่ทำงานเดียวให้สอดคล้องกับหน้าผู้ดูแลอื่น
    </Typography>
  </Stack>);
}

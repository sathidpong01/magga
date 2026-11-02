"use client";
import { Box, Button, Typography } from "@mui/material";
import { maggaColors } from "@/lib/design-tokens";

export default function MangaListError({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <Box role="alert" sx={{ py: 4, minHeight: 240 }}>
      <Typography component="h1" variant="h5" sx={{ fontWeight: 700 }}>
        โหลดรายการมังงะไม่สำเร็จ
      </Typography>
      <Typography sx={{ color: maggaColors.textSecondary, mt: 1 }}>
        ลองโหลดอีกครั้ง โดยคำค้นและตัวกรองยังอยู่ใน URL เดิม
      </Typography>
      <Button variant="outlined" onClick={retry} sx={{ minHeight: 44, mt: 2 }}>
        ลองใหม่
      </Button>
    </Box>
  );
}

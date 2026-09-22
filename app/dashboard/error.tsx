"use client";

import { Box } from "@mui/material";
import ErrorFallback from "@/app/components/ui/ErrorFallback";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Box sx={{ py: 6, px: 2, display: "flex", justifyContent: "center" }}>
      <ErrorFallback
        error={error}
        reset={reset}
        title="เกิดข้อผิดพลาดในแดชบอร์ด"
        description="ขออภัย เกิดข้อผิดพลาดในการโหลดข้อมูลแดชบอร์ด กรุณาลองใหม่อีกครั้ง"
      />
    </Box>
  );
}

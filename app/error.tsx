"use client";

import { Container } from "@mui/material";
import ErrorFallback from "@/app/components/ui/ErrorFallback";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <ErrorFallback
        error={error}
        reset={reset}
        title="เกิดข้อผิดพลาด"
        description="ขออภัย เกิดข้อผิดพลาดในการโหลดหน้านี้ กรุณาลองใหม่อีกครั้ง"
      />
    </Container>
  );
}

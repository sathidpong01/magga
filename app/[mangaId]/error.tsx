"use client";

import { Container } from "@mui/material";
import ErrorFallback from "@/app/components/ui/ErrorFallback";

export default function MangaError({
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
        title="ไม่สามารถโหลดมังงะได้"
        description="ขออภัย เกิดข้อผิดพลาดในการโหลดมังงะ กรุณาลองใหม่หรือกลับไปหน้าแรก"
      />
    </Container>
  );
}

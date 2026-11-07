"use client";
import { Alert, Button, Container } from "@mui/material";
export default function PollErrorPage({ reset }: { reset: () => void }) {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Alert severity="error" action={<Button onClick={reset}>ลองใหม่</Button>}>
        ระบบโหวตยังไม่พร้อม กรุณาลองใหม่ภายหลัง
      </Alert>
    </Container>
  );
}

"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { isValidCallbackUrl } from "@/lib/auth-helpers";
import AuthModal from "@/app/components/features/auth/AuthModal";

function SignInModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = isValidCallbackUrl(searchParams.get("callbackUrl"));
  const notice = searchParams.get("registered")
    ? "สมัครสมาชิกสำเร็จแล้ว กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ"
    : undefined;
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    router.push("/");
  };

  const handleSuccess = () => {
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <>
      <Box sx={{ minHeight: "100vh", bgcolor: "#0a0a0a" }} />
      <AuthModal
        open={open}
        onClose={handleClose}
        onSuccess={handleSuccess}
        callbackUrl={callbackUrl}
        notice={notice}
      />
    </>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: "100vh", bgcolor: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress sx={{ color: "#fbbf24" }} />
        </Box>
      }
    >
      <SignInModal />
    </Suspense>
  );
}

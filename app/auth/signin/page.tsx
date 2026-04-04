"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import AuthModal from "@/app/components/features/auth/AuthModal";
import { clearReauthInProgress } from "@/lib/auth-client";

function SignInModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    clearReauthInProgress();
    setOpen(false);
    router.push("/");
  };

  const handleSuccess = () => {
    clearReauthInProgress();
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

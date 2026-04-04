"use client";

import { useEffect, useState } from "react";
import {
  clearReauthInProgress,
  hasPendingSocialAuth,
  hasReauthInProgress,
  markReauthInProgress,
  useSession,
} from "@/lib/auth-client";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";

export default function SessionExpiredNotice() {
  const { data: session, isPending } = useSession();
  const [showNotice, setShowNotice] = useState(false);
  const [wasAuthenticated, setWasAuthenticated] = useState(false);

  useEffect(() => {
    // Track if user was previously authenticated
    if (!isPending && session) {
      setShowNotice(false);
      setWasAuthenticated(true);
      sessionStorage.setItem("wasAuthenticated", "true");
      clearReauthInProgress();
      return;
    }

    // Check if session expired (was authenticated -> now unauthenticated)
    if (!isPending && !session) {
      const previouslyAuth =
        sessionStorage.getItem("wasAuthenticated") === "true";
      const intentLogout = sessionStorage.getItem("intent_logout") === "true";
      const reauthInProgress = hasReauthInProgress();
      const pendingSocialAuth = hasPendingSocialAuth();

      if (
        (previouslyAuth || wasAuthenticated) &&
        !intentLogout &&
        !reauthInProgress &&
        !pendingSocialAuth
      ) {
        setShowNotice(true);
      } else if (pendingSocialAuth) {
        setShowNotice(false);
      }
      
      // Clean up storage items
      sessionStorage.removeItem("wasAuthenticated");
      setWasAuthenticated(false); // Fix: also clear component state
      if (intentLogout) {
        sessionStorage.removeItem("intent_logout");
      }
    }
  }, [session, isPending, wasAuthenticated]);

  const handleClose = () => {
    setShowNotice(false);
  };

  const handleLogin = () => {
    markReauthInProgress();
    setShowNotice(false);
    window.location.href = "/auth/signin";
  };

  if (!showNotice) return null;

  return (
    <Dialog
      open={showNotice}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "#171717",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 1,
        },
      }}
    >
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", gap: 1, color: "#a3a3a3" }}
      >
        <LogoutIcon fontSize="small" />
        Session หมดอายุ
      </DialogTitle>

      <DialogContent>
        <Typography sx={{ color: "#d4d4d4", mb: 1 }}>
          Session ของคุณหมดอายุแล้ว
        </Typography>
        <Typography variant="body2" sx={{ color: "#737373" }}>
          กรุณาเข้าสู่ระบบใหม่เพื่อใช้งานต่อ
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button onClick={handleClose} size="small" sx={{ color: "#737373" }}>
          ปิด
        </Button>
        <Button
          onClick={handleLogin}
          variant="contained"
          size="small"
          sx={{
            bgcolor: "#8b5cf6",
            "&:hover": { bgcolor: "#7c3aed" },
          }}
        >
          เข้าสู่ระบบ
        </Button>
      </DialogActions>
    </Dialog>
  );
}

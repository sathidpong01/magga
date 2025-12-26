"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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
  const { status } = useSession();
  const [showNotice, setShowNotice] = useState(false);
  const [wasAuthenticated, setWasAuthenticated] = useState(false);

  useEffect(() => {
    // Track if user was previously authenticated
    if (status === "authenticated") {
      setWasAuthenticated(true);
      sessionStorage.setItem("wasAuthenticated", "true");
    }

    // Check if session expired (was authenticated -> now unauthenticated)
    if (status === "unauthenticated") {
      const previouslyAuth =
        sessionStorage.getItem("wasAuthenticated") === "true";
      if (previouslyAuth || wasAuthenticated) {
        setShowNotice(true);
        sessionStorage.removeItem("wasAuthenticated");
      }
    }
  }, [status, wasAuthenticated]);

  const handleClose = () => {
    setShowNotice(false);
  };

  const handleLogin = () => {
    setShowNotice(false);
    window.location.href = "/api/auth/signin";
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

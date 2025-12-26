"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

// Warning threshold: 5 minutes before expiry
const WARNING_THRESHOLD_MS = 5 * 60 * 1000;
// Check interval: every 30 seconds
const CHECK_INTERVAL_MS = 30 * 1000;

export default function SessionExpiryWarning() {
  const { data: session, status, update } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const checkSessionExpiry = useCallback(() => {
    if (!session?.expires) return;

    const expiresAt = new Date(session.expires).getTime();
    const now = Date.now();
    const remaining = expiresAt - now;

    if (remaining <= 0) {
      // Session expired - will be handled by NextAuth
      setShowWarning(false);
      return;
    }

    if (remaining <= WARNING_THRESHOLD_MS) {
      setTimeLeft(Math.floor(remaining / 1000));
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [session?.expires]);

  // Check session expiry periodically
  useEffect(() => {
    if (status !== "authenticated") return;

    // Initial check
    checkSessionExpiry();

    // Set up interval
    const interval = setInterval(checkSessionExpiry, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [status, checkSessionExpiry]);

  // Countdown timer when warning is shown
  useEffect(() => {
    if (!showWarning) return;

    const countdown = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [showWarning]);

  const handleExtendSession = async () => {
    try {
      // Trigger session refresh
      await update();
      setShowWarning(false);
    } catch (error) {
      console.error("Failed to extend session:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!showWarning) return null;

  return (
    <Dialog
      open={showWarning}
      onClose={() => {}}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "#171717",
          border: "1px solid rgba(251, 191, 36, 0.3)",
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          color: "#fbbf24",
        }}
      >
        <AccessTimeIcon />
        Session ใกล้หมดอายุ
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: "#d4d4d4", mb: 2 }}>
          Session ของคุณจะหมดอายุใน{" "}
          <Box component="span" sx={{ color: "#fbbf24", fontWeight: 600 }}>
            {formatTime(timeLeft)}
          </Box>{" "}
          นาที
        </Typography>
        <Typography variant="body2" sx={{ color: "#a3a3a3", mb: 2 }}>
          กดปุ่ม &quot;ต่ออายุ&quot; เพื่อใช้งานต่อ หรือระบบจะออกจากระบบอัตโนมัติ
        </Typography>
        <LinearProgress
          variant="determinate"
          value={(timeLeft / (WARNING_THRESHOLD_MS / 1000)) * 100}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: "rgba(251, 191, 36, 0.2)",
            "& .MuiLinearProgress-bar": {
              bgcolor: "#fbbf24",
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button
          onClick={handleExtendSession}
          variant="contained"
          fullWidth
          sx={{
            bgcolor: "#fbbf24",
            color: "#000",
            "&:hover": { bgcolor: "#f59e0b" },
            fontWeight: 600,
          }}
        >
          ต่ออายุ Session
        </Button>
      </DialogActions>
    </Dialog>
  );
}

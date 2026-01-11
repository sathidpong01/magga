"use client";

import { useSession, signOut } from "next-auth/react";
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
  const [isExtending, setIsExtending] = useState(false);

  const checkSessionExpiry = useCallback(() => {
    if (!session?.expires) return;

    const expiresAt = new Date(session.expires).getTime();
    const now = Date.now();
    const remaining = expiresAt - now;

    if (remaining <= 0) {
      setShowWarning(false);
      signOut({ callbackUrl: "/" });
      return;
    }

    if (remaining <= WARNING_THRESHOLD_MS) {
      setTimeLeft(Math.floor(remaining / 1000));
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [session?.expires]);

  useEffect(() => {
    if (status !== "authenticated") return;
    checkSessionExpiry();
    const interval = setInterval(checkSessionExpiry, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [status, checkSessionExpiry]);

  useEffect(() => {
    if (!showWarning) return;
    const countdown = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          signOut({ callbackUrl: "/" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdown);
  }, [showWarning]);

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      await update();
      setShowWarning(false);
    } catch (error) {
      console.error("Failed to extend session:", error);
    } finally {
      setIsExtending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!showWarning) return null;

  const isUrgent = timeLeft < 60;

  return (
    <Dialog
      open={showWarning}
      onClose={() => {}}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "#171717",
          border: `1px solid ${
            isUrgent ? "rgba(239, 68, 68, 0.4)" : "rgba(255,255,255,0.1)"
          }`,
          borderRadius: 1,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: isUrgent ? "#ef4444" : "#fbbf24",
        }}
      >
        <AccessTimeIcon fontSize="small" />
        {isUrgent ? "Session ใกล้หมดอายุ!" : "Session ใกล้หมดอายุ"}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Typography sx={{ color: "#d4d4d4" }}>เหลือเวลาอีก</Typography>
          <Typography
            sx={{
              color: isUrgent ? "#ef4444" : "#fbbf24",
              fontWeight: 600,
              fontFamily: "monospace",
              fontSize: "1.25rem",
            }}
          >
            {formatTime(timeLeft)}
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ color: "#737373", mb: 2 }}>
          กด "ต่ออายุ" เพื่อใช้งานต่อ
        </Typography>

        <LinearProgress
          variant="determinate"
          value={(timeLeft / (WARNING_THRESHOLD_MS / 1000)) * 100}
          sx={{
            height: 4,
            borderRadius: 1,
            bgcolor: "rgba(255,255,255,0.1)",
            "& .MuiLinearProgress-bar": {
              bgcolor: isUrgent ? "#ef4444" : "#fbbf24",
            },
          }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button
          onClick={() => signOut({ callbackUrl: "/" })}
          size="small"
          sx={{ color: "#737373" }}
        >
          ออกจากระบบ
        </Button>
        <Button
          onClick={handleExtendSession}
          variant="contained"
          size="small"
          disabled={isExtending}
          sx={{
            bgcolor: isUrgent ? "#ef4444" : "#fbbf24",
            color: "#000",
            "&:hover": { bgcolor: isUrgent ? "#dc2626" : "#f59e0b" },
          }}
        >
          {isExtending ? "กำลังต่ออายุ..." : "ต่ออายุ"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

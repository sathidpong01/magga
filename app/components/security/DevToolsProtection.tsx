"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Box, Typography, Button, Paper } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import HomeIcon from "@mui/icons-material/Home";

interface DetectionInfo {
  method: string;
  timestamp: string;
  url: string;
  screenSize: string;
  windowSize: string;
  timezone: string;
  language: string;
  userAgent: string;
}

export default function DevToolsProtection() {
  const { data: session } = useSession();
  const [isBlocked, setIsBlocked] = useState(false);
  const [detectionInfo, setDetectionInfo] = useState<DetectionInfo | null>(
    null
  );
  const devtoolsOpenRef = useRef(false);

  // Skip protection in development mode
  const isDevelopment = process.env.NODE_ENV === "development";

  // Skip protection for Admin users
  const isAdmin = session?.user?.role === "ADMIN";

  const handleDetection = useCallback(
    (method: string) => {
      if (isAdmin || isDevelopment) return;

      const info: DetectionInfo = {
        method,
        timestamp: new Date().toLocaleString("th-TH", {
          timeZone: "Asia/Bangkok",
        }),
        url: typeof window !== "undefined" ? window.location.href : "",
        screenSize:
          typeof window !== "undefined"
            ? `${screen.width}x${screen.height}`
            : "",
        windowSize:
          typeof window !== "undefined"
            ? `${window.innerWidth}x${window.innerHeight}`
            : "",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: typeof navigator !== "undefined" ? navigator.language : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      };

      setDetectionInfo(info);
      setIsBlocked(true);

      // Note: Avoid logging sensitive info to console in production
      // If needed, send to a secure backend API for logging
    },
    [isAdmin]
  );

  // Handle back to home - force reload
  const handleBackToHome = () => {
    window.location.href = "/";
  };

  useEffect(() => {
    if (isAdmin || isDevelopment) return;

    // 1. Block keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        handleDetection("F12 key pressed");
        return;
      }
      // Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === "I") {
        e.preventDefault();
        handleDetection("Ctrl+Shift+I pressed");
        return;
      }
      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === "J") {
        e.preventDefault();
        handleDetection("Ctrl+Shift+J pressed");
        return;
      }
      // Ctrl+Shift+C (Element Inspector)
      if (e.ctrlKey && e.shiftKey && e.key === "C") {
        e.preventDefault();
        handleDetection("Ctrl+Shift+C pressed");
        return;
      }
      // Ctrl+U (View Source)
      if (e.ctrlKey && e.key === "u") {
        e.preventDefault();
        handleDetection("Ctrl+U pressed");
        return;
      }
      // Ctrl+S (Save page)
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        return;
      }
      // Ctrl+A (Select all) - only prevent on images/content areas
      if (e.ctrlKey && e.key === "a") {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          return;
        }
      }
    };

    // 2. Block right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 3. Block image drag
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG") {
        e.preventDefault();
        return false;
      }
    };

    // 4. Block copy (except in input/textarea)
    const handleCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
        e.preventDefault();
        return false;
      }
    };

    // 5. Block text selection via CSS
    const style = document.createElement("style");
    style.id = "magga-protection-styles";
    style.textContent = `
      img {
        -webkit-user-drag: none;
        -khtml-user-drag: none;
        -moz-user-drag: none;
        -o-user-drag: none;
        user-drag: none;
        pointer-events: auto;
      }
      .manga-content, .manga-page, .reader-container {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
    `;
    document.head.appendChild(style);

    // 6. DevTools open detection (window size based)
    const threshold = 160;

    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold =
        window.outerHeight - window.innerHeight > threshold;

      const isOpen = widthThreshold || heightThreshold;

      if (isOpen && !devtoolsOpenRef.current) {
        devtoolsOpenRef.current = true;
        handleDetection("DevTools window size detected");
      } else if (!isOpen && devtoolsOpenRef.current) {
        // DevTools was closed - reset block state
        devtoolsOpenRef.current = false;
        setIsBlocked(false);
      }
    };

    // Add event listeners
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("copy", handleCopy);

    // Check DevTools on resize
    window.addEventListener("resize", checkDevTools);

    // Periodic checks
    const devToolsInterval = setInterval(checkDevTools, 500);

    // Initial check
    checkDevTools();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("copy", handleCopy);
      window.removeEventListener("resize", checkDevTools);
      clearInterval(devToolsInterval);
      // Remove injected styles
      const injectedStyle = document.getElementById("magga-protection-styles");
      if (injectedStyle) injectedStyle.remove();
    };
  }, [isAdmin, handleDetection]);

  // Don't render block screen for admin or in development
  if (isAdmin || isDevelopment || !isBlocked) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        background:
          "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Paper
        sx={{
          maxWidth: 500,
          width: "100%",
          p: 4,
          borderRadius: 3,
          bgcolor: "#1e1e2e",
          border: "1px solid rgba(139, 92, 246, 0.3)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
          textAlign: "center",
        }}
      >
        {/* Warning Icon */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            bgcolor: "rgba(139, 92, 246, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 3,
          }}
        >
          <WarningAmberIcon sx={{ fontSize: 48, color: "#a78bfa" }} />
        </Box>

        {/* Title */}
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            color: "#a78bfa",
            mb: 1,
          }}
        >
          การเข้าถึงถูกปฏิเสธ
        </Typography>

        {/* Subtitle */}
        <Typography variant="body1" sx={{ color: "#94a3b8", mb: 4 }}>
          ระบบตรวจพบการใช้งาน Developer Tools
          <br />
          เพื่อความปลอดภัยของเว็บไซต์ การเข้าถึงถูกจำกัด
        </Typography>

        {/* Detection Info */}
        {detectionInfo && (
          <Paper
            sx={{
              p: 2,
              mb: 4,
              bgcolor: "#0f0f1a",
              borderRadius: 1,
              border: "1px solid rgba(255, 255, 255, 0.1)",
              textAlign: "left",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: "#a78bfa",
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              📋 รายละเอียดการตรวจจับ
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                fontSize: "0.8rem",
              }}
            >
              <InfoRow label="วิธีการตรวจจับ" value={detectionInfo.method} />
              <InfoRow label="เวลา" value={detectionInfo.timestamp} />
              <InfoRow label="URL" value={detectionInfo.url} truncate />
              <InfoRow label="ขนาดหน้าจอ" value={detectionInfo.screenSize} />
              <InfoRow label="ขนาดหน้าต่าง" value={detectionInfo.windowSize} />
              <InfoRow label="เขตเวลา" value={detectionInfo.timezone} />
              <InfoRow label="ภาษา" value={detectionInfo.language} />
              <InfoRow
                label="User Agent"
                value={detectionInfo.userAgent}
                truncate
              />
            </Box>
          </Paper>
        )}

        {/* Back Button */}
        <Button
          onClick={handleBackToHome}
          variant="contained"
          startIcon={<HomeIcon />}
          sx={{
            bgcolor: "#8b5cf6",
            color: "#fff",
            fontWeight: "bold",
            px: 4,
            py: 1.5,
            borderRadius: 1,
            "&:hover": {
              bgcolor: "#7c3aed",
            },
          }}
        >
          กลับหน้าหลัก
        </Button>

        {/* Footer */}
        <Typography
          variant="caption"
          sx={{ display: "block", mt: 3, color: "#64748b" }}
        >
          ปิด Developer Tools แล้วหน้าจอนี้จะหายไปอัตโนมัติ
          <br />© {new Date().getFullYear()} MAGGA - สงวนลิขสิทธิ์
        </Typography>
      </Paper>
    </Box>
  );
}

function InfoRow({
  label,
  value,
  truncate,
}: {
  label: string;
  value: string;
  truncate?: boolean;
}) {
  return (
    <Typography variant="body2" sx={{ color: "#94a3b8" }}>
      <strong style={{ color: "#e2e8f0" }}>{label}:</strong>{" "}
      <span
        style={{
          wordBreak: truncate ? "break-all" : "normal",
          display: truncate ? "inline-block" : "inline",
          maxWidth: truncate ? "100%" : "none",
        }}
      >
        {value}
      </span>
    </Typography>
  );
}

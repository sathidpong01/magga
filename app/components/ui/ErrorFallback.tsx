"use client";

import { Box, Typography, Button } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RefreshIcon from "@mui/icons-material/Refresh";

interface ErrorFallbackProps {
  error?: Error;
  reset?: () => void;
  title?: string;
  description?: string;
}

export default function ErrorFallback({
  error,
  reset,
  title = "เกิดข้อผิดพลาด",
  description = "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
}: ErrorFallbackProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 10,
        px: 3,
        textAlign: "center",
        minHeight: 400,
      }}
    >
      <Box
        sx={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          bgcolor: "rgba(239, 68, 68, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 3,
        }}
      >
        <ErrorOutlineIcon
          sx={{
            fontSize: 60,
            color: "#ef4444",
          }}
        />
      </Box>

      <Typography
        variant="h5"
        fontWeight={600}
        sx={{ color: "#ef4444", mb: 1 }}
      >
        {title}
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 1, maxWidth: 400 }}
      >
        {description}
      </Typography>

      {error && process.env.NODE_ENV === "development" && (
        <Typography
          variant="caption"
          sx={{
            color: "text.disabled",
            mb: 3,
            fontFamily: "monospace",
            maxWidth: 500,
            wordBreak: "break-all",
          }}
        >
          {error.message}
        </Typography>
      )}

      {reset && (
        <Button
          variant="contained"
          onClick={reset}
          startIcon={<RefreshIcon />}
          sx={{
            bgcolor: "#ef4444",
            "&:hover": { bgcolor: "#dc2626" },
            mt: 2,
          }}
        >
          ลองใหม่
        </Button>
      )}
    </Box>
  );
}

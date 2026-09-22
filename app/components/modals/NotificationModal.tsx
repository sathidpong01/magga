import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlined";
import { maggaColors } from "@/lib/design-tokens";

interface NotificationModalProps {
  open: boolean;
  onClose: () => void;
  type: "success" | "error";
  title: string;
  message: string;
  // Legacy props (old format)
  onConfirm?: () => void;
  confirmText?: string;
  // New props (new format)
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export default function NotificationModal({
  open,
  onClose,
  type,
  title,
  message,
  onConfirm,
  confirmText = "OK",
  primaryAction,
  secondaryAction,
}: NotificationModalProps) {
  // Support both old and new format
  const hasPrimaryAction = primaryAction || onConfirm;
  const primaryLabel = primaryAction?.label || confirmText;
  const primaryOnClick = primaryAction?.onClick || onConfirm || onClose;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: maggaColors.surfaceAlt,
            color: "#fafafa",
            border: `1px solid ${maggaColors.border}`,
            borderRadius: 2,
          },
        }
      }}
    >
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 2 }}
      >
        {type === "success" ? (
          <CheckCircleOutlineIcon color="success" sx={{ fontSize: 28 }} />
        ) : (
          <ErrorOutlineIcon color="error" sx={{ fontSize: 28 }} />
        )}
        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ pb: 1 }}>
        {type === "error" ? (
          <Alert
            severity="error"
            sx={{
              bgcolor: "rgba(211, 47, 47, 0.1)",
              color: "#fca5a5",
              borderRadius: 1.5,
            }}
          >
            {message}
          </Alert>
        ) : (
          <Typography
            variant="body1"
            sx={{ color: "#d4d4d4", lineHeight: 1.6 }}
          >
            {message}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 2, gap: 1 }}>
        {secondaryAction && (
          <Button
            onClick={secondaryAction.onClick}
            variant="outlined"
            sx={{
              color: "#a3a3a3",
              borderColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: 1.5,
              "&:hover": {
                borderColor: "rgba(255, 255, 255, 0.3)",
                bgcolor: "rgba(255, 255, 255, 0.05)",
              },
            }}
          >
            {secondaryAction.label}
          </Button>
        )}
        {!hasPrimaryAction && (
          <Button onClick={onClose} color="inherit" sx={{ borderRadius: 1.5 }}>
            Close
          </Button>
        )}
        {hasPrimaryAction && (
          <Button
            onClick={primaryOnClick}
            variant="contained"
            color={type === "success" ? "success" : "error"}
            autoFocus
            sx={{ borderRadius: 1.5 }}
          >
            {primaryLabel}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
} from "@mui/material";

type BanNoticeModalProps = {
  open: boolean;
  onClose: () => void;
  message?: string;
  redirectToHome?: boolean; // If true, shows "กลับไปหน้าแรก", otherwise "ตกลง"
};

export default function BanNoticeModal({
  open,
  onClose,
  message = "บัญชีของคุณถูกระงับการใช้งาน",
  redirectToHome = false,
}: BanNoticeModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: "#0f0f0f",
          color: "#fafafa",
          borderRadius: 1,
          border: "1px solid #333",
          minWidth: 320,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          p: 1,
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(4px)",
            bgcolor: "rgba(0, 0, 0, 0.8)",
          },
        },
      }}
    >
      <Box sx={{ textAlign: "center", pt: 2, pb: 1 }}>
        <DialogTitle
          sx={{
            color: "#ef4444",
            fontWeight: 700,
            fontSize: "1.25rem",
            p: 1,
          }}
        >
          ระงับการใช้งาน
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <DialogContentText
            sx={{
              color: "#a3a3a3",
              fontSize: "0.95rem",
              fontWeight: 400,
            }}
          >
            {message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", p: 2 }}>
          <Button
            onClick={onClose}
            variant="contained"
            disableElevation
            sx={{
              bgcolor: "#ef4444",
              color: "white",
              fontWeight: 600,
              px: 4,
              py: 1,
              borderRadius: 1,
              textTransform: "none",
              "&:hover": {
                bgcolor: "#dc2626",
              },
            }}
          >
            {redirectToHome ? "กลับไปหน้าแรก" : "ตกลง"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

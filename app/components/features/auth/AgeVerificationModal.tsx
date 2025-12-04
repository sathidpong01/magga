"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export default function AgeVerificationModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if user has already verified
    const isVerified = localStorage.getItem("isAgeVerified");
    if (!isVerified) {
      setOpen(true);
    }
  }, []);

  const handleVerify = () => {
    localStorage.setItem("isAgeVerified", "true");
    setOpen(false);
  };

  const handleExit = () => {
    window.location.href = "https://www.google.com";
  };

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      aria-labelledby="age-verification-title"
      aria-describedby="age-verification-description"
      PaperProps={{
        sx: {
          borderRadius: 2,
          textAlign: "center",
          p: 2,
          maxWidth: "400px",
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(10px)",
          },
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 1 }}>
        <WarningAmberIcon color="warning" sx={{ fontSize: 60 }} />
      </Box>
      <DialogTitle id="age-verification-title" sx={{ fontWeight: "bold", fontSize: "1.5rem" }}>
        Content Warning
      </DialogTitle>
      <DialogContent>
        <Typography id="age-verification-description" variant="body1" gutterBottom>
          This website contains mature content intended for audiences 18 years of
          age or older.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          By entering, you confirm that you are at least 18 years old.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ flexDirection: "column", gap: 1, pb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          onClick={handleVerify}
          sx={{ borderRadius: 50, py: 1.5, fontWeight: "bold" }}
        >
          I am 18+ - Enter
        </Button>
        <Button
          variant="text"
          color="inherit"
          fullWidth
          onClick={handleExit}
          sx={{ borderRadius: 50 }}
        >
          Exit
        </Button>
      </DialogActions>
    </Dialog>
  );
}

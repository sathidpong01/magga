"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Divider,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import GoogleIcon from "@mui/icons-material/Google";

interface Props {
  hasPassword: boolean;
  email: string | null | undefined;
}

export default function SecurityTab({ hasPassword, email }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: hasPassword ? currentPassword : undefined,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      setMessage({ type: "success", text: "Password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // If user didn't have a password before, they do now. 
      // In a real app, we might want to reload the page or update state to reflect this.
      if (!hasPassword) {
         window.location.reload(); 
      }

    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Paper sx={{ p: 3, bgcolor: "#171717", border: "1px solid rgba(255,255,255,0.1)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <LockIcon sx={{ color: "#fbbf24", fontSize: 28 }} />
          <Typography variant="h6" fontWeight="bold">
            Password Management
          </Typography>
        </Box>

        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }}>
            {message.text}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {hasPassword && (
            <TextField
              id="current-password"
              fullWidth
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              margin="normal"
              required
              sx={{
                "& .MuiInputLabel-root": { color: "#a3a3a3" },
                "& .MuiOutlinedInput-root": {
                  color: "#fafafa",
                  "& fieldset": { borderColor: "#404040" },
                  "&:hover fieldset": { borderColor: "#fbbf24" },
                  "&.Mui-focused fieldset": { borderColor: "#fbbf24" },
                },
              }}
            />
          )}

          <TextField
            id="new-password"
            fullWidth
            label={hasPassword ? "New Password" : "Set New Password"}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
            required
            helperText="Must be at least 6 characters"
            sx={{
              "& .MuiInputLabel-root": { color: "#a3a3a3" },
              "& .MuiOutlinedInput-root": {
                color: "#fafafa",
                "& fieldset": { borderColor: "#404040" },
                "&:hover fieldset": { borderColor: "#fbbf24" },
                "&.Mui-focused fieldset": { borderColor: "#fbbf24" },
              },
              "& .MuiFormHelperText-root": { color: "#a3a3a3" },
            }}
          />

          <TextField
            id="confirm-password"
            fullWidth
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            required
            sx={{
              "& .MuiInputLabel-root": { color: "#a3a3a3" },
              "& .MuiOutlinedInput-root": {
                color: "#fafafa",
                "& fieldset": { borderColor: "#404040" },
                "&:hover fieldset": { borderColor: "#fbbf24" },
                "&.Mui-focused fieldset": { borderColor: "#fbbf24" },
              },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              mt: 3,
              bgcolor: "#fbbf24",
              color: "#000",
              fontWeight: "bold",
              "&:hover": { bgcolor: "#f59e0b" },
            }}
          >
            {loading ? "Updating..." : hasPassword ? "Change Password" : "Set Password"}
          </Button>
        </form>
      </Paper>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Connected Accounts
        </Typography>
        <Paper sx={{ p: 2, bgcolor: "#171717", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <GoogleIcon sx={{ color: "#fff" }} />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">Google</Typography>
                <Typography variant="body2" color="text.secondary">
                  {email}
                </Typography>
              </Box>
            </Box>
            <Box>
                <Typography variant="caption" sx={{ color: "#10b981", fontWeight: "bold", border: "1px solid #10b981", px: 1, py: 0.5, borderRadius: 1 }}>
                    CONNECTED
                </Typography>
            </Box>
          </Box>
        </Paper>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            * Your account is automatically linked to Google when you sign in with the same email address.
        </Typography>
      </Box>
    </Box>
  );
}

"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Avatar,
  Stack,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import SaveIcon from "@mui/icons-material/Save";
import { md5Sync } from "@/lib/md5";

interface UserData {
  name: string | null;
  username: string | null;
  email: string | null;
  image: string | null;
}

interface Props {
  user: UserData;
}

export default function ProfileTab({ user }: Props) {
  const [formData, setFormData] = useState({
    name: user.name || "",
    username: user.username || "",
    email: user.email || "",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculate Gravatar URL
  const gravatarUrl = `https://www.gravatar.com/avatar/${md5Sync(formData.email.toLowerCase().trim())}?d=mp&s=200`;
  const displayImage = user.image || gravatarUrl;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setMessage({ type: "success", text: "Profile updated successfully!" });
      // Reload to reflect changes (especially if email/username changed which might affect session)
      window.location.reload();

    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Paper sx={{ p: 3, bgcolor: "#171717", border: "1px solid rgba(255,255,255,0.1)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
          <PersonIcon sx={{ color: "#fbbf24", fontSize: 28 }} />
          <Typography variant="h6" fontWeight="bold">
            Profile Information
          </Typography>
        </Box>

        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }}>
            {message.text}
          </Alert>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
          <Avatar
            src={displayImage}
            alt={formData.name}
            sx={{ width: 100, height: 100, mb: 2, border: "2px solid #fbbf24" }}
          />
          <Typography variant="caption" color="text.secondary">
            Avatar is managing by Gravatar or Google
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              id="name"
              fullWidth
              label="Display Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

            <TextField
              id="username"
              fullWidth
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              helperText="Unique username for your profile"
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
              id="email"
              fullWidth
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              startIcon={<SaveIcon />}
              sx={{
                bgcolor: "#fbbf24",
                color: "#000",
                fontWeight: "bold",
                "&:hover": { bgcolor: "#f59e0b" },
              }}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}

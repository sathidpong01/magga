"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Paper,
  Divider,
  Grid,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import WarningIcon from "@mui/icons-material/Warning";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { useSession } from "next-auth/react";
import md5 from "md5";

interface UserData {
  name: string | null;
  username: string | null;
  email: string | null;
  image: string | null;
}

interface Props {
  user: UserData;
  hasPassword: boolean;
}

export default function AccountSettings({ user, hasPassword }: Props) {
  const [formData, setFormData] = useState({
    name: user.name || "",
    username: user.username || "",
    email: user.email || "",
  });
  
  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [openEmailConfirm, setOpenEmailConfirm] = useState(false);

  // Calculate Gravatar URL
  const gravatarUrl = `https://www.gravatar.com/avatar/${md5(formData.email.toLowerCase().trim())}?d=mp&s=200`;
  const displayImage = user.image || gravatarUrl;

  const { data: session, update } = useSession();

  const handleProfileUpdate = async () => {
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      
      // Update session with new data
      await update({
        name: formData.name,
        email: formData.email,
      });

      setMessage({ type: "success", text: "Profile updated successfully!" });
      window.location.reload();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    setMessage(null);
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: hasPassword ? passwordData.currentPassword : undefined,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");
      setMessage({ type: "success", text: "Password updated successfully!" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      if (!hasPassword) window.location.reload();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 4 }}>
        Account Settings
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      {/* My Profile Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
          My Profile
        </Typography>
        
        <Paper sx={{ p: 3, bgcolor: "#171717", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 4 }}>
            <Avatar
              src={displayImage}
              alt={formData.name}
              sx={{ width: 80, height: 80, border: "2px solid #fbbf24" }}
            />
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 0.5 }}>
                Profile Image
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Managed by Gravatar or Google
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: "#a3a3a3" }}>Display Name</Typography>
              <TextField
                fullWidth
                id="display-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                variant="outlined"
                size="small"
                inputProps={{ "aria-label": "Display Name" }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#262626",
                    "& fieldset": { borderColor: "#404040" },
                    "&:hover fieldset": { borderColor: "#fbbf24" },
                    "&.Mui-focused fieldset": { borderColor: "#fbbf24" },
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: "#a3a3a3" }}>Username</Typography>
              <TextField
                fullWidth
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                variant="outlined"
                size="small"
                inputProps={{ "aria-label": "Username" }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#262626",
                    "& fieldset": { borderColor: "#404040" },
                    "&:hover fieldset": { borderColor: "#fbbf24" },
                    "&.Mui-focused fieldset": { borderColor: "#fbbf24" },
                  }
                }}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <Button 
              variant="contained" 
              onClick={handleProfileUpdate}
              disabled={loading}
              sx={{ bgcolor: "#fbbf24", color: "black", fontWeight: "bold", "&:hover": { bgcolor: "#f59e0b" } }}
            >
              Save Profile
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Account Security Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
          Account Security
        </Typography>

        <Paper sx={{ p: 3, bgcolor: "#171717", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2 }}>
          {/* Email */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: "#a3a3a3" }}>Email</Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs>
                <TextField
                  fullWidth
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  variant="outlined"
                  size="small"
                  inputProps={{ "aria-label": "Email Address" }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "#262626",
                      "& fieldset": { borderColor: "#404040" },
                      "&:hover fieldset": { borderColor: "#fbbf24" },
                      "&.Mui-focused fieldset": { borderColor: "#fbbf24" },
                    }
                  }}
                />
              </Grid>
              <Grid item>
                <Button 
                  variant="outlined" 
                  onClick={() => {
                    if (formData.email !== user.email) {
                      setOpenEmailConfirm(true);
                    } else {
                      setMessage({ type: "info", text: "Email has not been changed" });
                    }
                  }}
                  disabled={loading}
                  sx={{ color: "#fbbf24", borderColor: "#fbbf24", "&:hover": { borderColor: "#f59e0b", bgcolor: "rgba(251, 191, 36, 0.1)" } }}
                >
                  Change Email
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Email Confirmation Dialog */}
          <Dialog
            open={openEmailConfirm}
            onClose={() => setOpenEmailConfirm(false)}
            PaperProps={{
              sx: {
                bgcolor: "#171717",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fafafa",
              }
            }}
          >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon sx={{ color: "#fbbf24" }} />
              Confirm Email Change
            </DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ color: "#a3a3a3" }}>
                Are you sure you want to change your email address to <strong>{formData.email}</strong>?
                <br /><br />
                This may affect your login method if you use Google Sign-In with the old email.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenEmailConfirm(false)} sx={{ color: "#a3a3a3" }}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setOpenEmailConfirm(false);
                  handleProfileUpdate();
                }} 
                variant="contained"
                sx={{ bgcolor: "#fbbf24", color: "black", fontWeight: "bold", "&:hover": { bgcolor: "#f59e0b" } }}
              >
                Confirm Change
              </Button>
            </DialogActions>
          </Dialog>

          <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.1)" }} />

          {/* Password */}
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handlePasswordUpdate(); }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: "#a3a3a3" }}>Password</Typography>
            
            {hasPassword && (
              <TextField
                fullWidth
                id="current-password"
                placeholder="Current Password"
                type={showPassword ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                size="small"
                autoComplete="current-password"
                sx={{ mb: 2, "& .MuiOutlinedInput-root": { bgcolor: "#262626", "& fieldset": { borderColor: "#404040" } } }}
              />
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="new-password"
                  placeholder={hasPassword ? "New Password" : "Set New Password"}
                  type={showPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  size="small"
                  autoComplete="new-password"
                  inputProps={{ "aria-label": "New Password" }}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#262626", "& fieldset": { borderColor: "#404040" } } }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: "#a3a3a3" }}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="confirm-password"
                  placeholder="Confirm New Password"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  size="small"
                  autoComplete="new-password"
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#262626", "& fieldset": { borderColor: "#404040" } } }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
              <Button 
                type="submit"
                variant="outlined" 
                disabled={loading}
                sx={{ color: "#fbbf24", borderColor: "#fbbf24", "&:hover": { borderColor: "#f59e0b", bgcolor: "rgba(251, 191, 36, 0.1)" } }}
              >
                {hasPassword ? "Change Password" : "Set Password"}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

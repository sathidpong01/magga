"use client";

import { useState, useCallback, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  TextField,
  Button,
  Typography,
  Divider,
  IconButton,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import GoogleIcon from "@mui/icons-material/Google";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultTab?: "signin" | "register";
}

export default function AuthModal({ open, onClose, onSuccess, defaultTab = "signin" }: AuthModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState<"signin" | "register">(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Sign In form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Register form
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setError("");
      setSuccess("");
      setUsername("");
      setPassword("");
      setRegisterData({ username: "", email: "", password: "", confirmPassword: "" });
    }
  }, [open]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        username,
        password,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        setSuccess("เข้าสู่ระบบสำเร็จ!");
        setTimeout(() => {
          onClose();
          onSuccess?.();
          router.refresh();
        }, 1000);
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (registerData.password !== registerData.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: registerData.username,
          email: registerData.email,
          password: registerData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "สมัครสมาชิกไม่สำเร็จ");
      }

      // Auto login after register
      const loginRes = await signIn("credentials", {
        redirect: false,
        username: registerData.username,
        password: registerData.password,
      });

      if (loginRes?.ok) {
        setSuccess("สมัครสมาชิกและเข้าสู่ระบบสำเร็จ!");
        setTimeout(() => {
          onClose();
          onSuccess?.();
          router.refresh();
        }, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Save current path for callback
    signIn("google", { callbackUrl: pathname });
  };

  const textFieldSx = {
    "& .MuiInputLabel-root": { color: "#a3a3a3" },
    "& .MuiOutlinedInput-root": {
      color: "#fafafa",
      "& fieldset": { borderColor: "#404040" },
      "&:hover fieldset": { borderColor: "#fbbf24" },
      "&.Mui-focused fieldset": { borderColor: "#fbbf24" },
    },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "#171717",
          color: "#fafafa",
          borderRadius: 1,
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Typography variant="h6" fontWeight={600}>
          {tab === "signin" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: "#a3a3a3" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Tabs
          value={tab}
          onChange={(_, v) => { setTab(v); setError(""); setSuccess(""); }}
          sx={{
            mb: 2,
            "& .MuiTab-root": { color: "#a3a3a3" },
            "& .Mui-selected": { color: "#fbbf24 !important" },
            "& .MuiTabs-indicator": { bgcolor: "#fbbf24" },
          }}
        >
          <Tab value="signin" label="เข้าสู่ระบบ" />
          <Tab value="register" label="สมัครสมาชิก" />
        </Tabs>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {tab === "signin" ? (
          <Box component="form" onSubmit={handleSignIn}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="ชื่อผู้ใช้ หรือ อีเมล"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="รหัสผ่าน"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={textFieldSx}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 2, mb: 2, bgcolor: "#fbbf24", color: "#000", "&:hover": { bgcolor: "#f59e0b" } }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "เข้าสู่ระบบ"}
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleRegister}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="ชื่อผู้ใช้"
              autoFocus
              value={registerData.username}
              onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="อีเมล"
              type="email"
              value={registerData.email}
              onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="รหัสผ่าน"
              type="password"
              value={registerData.password}
              onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="ยืนยันรหัสผ่าน"
              type="password"
              value={registerData.confirmPassword}
              onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
              sx={textFieldSx}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 2, mb: 2, bgcolor: "#fbbf24", color: "#000", "&:hover": { bgcolor: "#f59e0b" } }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "สมัครสมาชิก"}
            </Button>
          </Box>
        )}

        <Divider sx={{ my: 2, borderColor: "#404040" }}>หรือ</Divider>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          sx={{
            color: "#fafafa",
            borderColor: "#404040",
            "&:hover": { borderColor: "#fbbf24", bgcolor: "rgba(251, 191, 36, 0.08)" },
          }}
        >
          ดำเนินการผ่าน Google
        </Button>
      </DialogContent>
    </Dialog>
  );
}

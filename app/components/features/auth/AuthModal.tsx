"use client";

import { useState, useEffect } from "react";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  Box,
  TextField,
  Button,
  Typography,
  Divider,
  IconButton,
  CircularProgress,
  Alert,
  InputAdornment,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import GoogleIcon from "@mui/icons-material/Google";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Image from "next/image";
import Link from "next/link";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  callbackUrl?: string;
}

export default function AuthModal({ open, onClose, onSuccess, callbackUrl = "/" }: AuthModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (open) {
      setError("");
      setSuccess("");
      setUsername("");
      setPassword("");
      setShowPassword(false);
    }
  }, [open]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = username.includes("@")
        ? await signIn.email({ email: username, password })
        : await (signIn as any).username({ username, password });

      if (result?.error) {
        setError(result.error.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      } else {
        setSuccess("เข้าสู่ระบบสำเร็จ!");
        setTimeout(() => {
          onClose();
          onSuccess?.();
          router.refresh();
        }, 800);
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn.social({ provider: "google", callbackURL: callbackUrl });
  };

  const textFieldSx = {
    "& .MuiInputLabel-root": { color: "#a3a3a3" },
    "& .MuiOutlinedInput-root": {
      color: "#fafafa",
      bgcolor: "#262626",
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
      slotProps={{
        backdrop: { sx: { backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" } },
      }}
      PaperProps={{
        sx: {
          bgcolor: "#171717",
          color: "#fafafa",
          borderRadius: 2,
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{ position: "relative", pt: 4, pb: 2, px: 4, textAlign: "center" }}>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ position: "absolute", top: 12, right: 12, color: "#a3a3a3", "&:hover": { color: "#fafafa" } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <Image
              src="/logo.svg"
              alt="MAGGA"
              width={90}
              height={28}
              style={{ width: "auto", height: "28px" }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          </Box>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
            ยินดีต้อนรับกลับ
          </Typography>
          <Typography variant="body2" sx={{ color: "#a3a3a3" }}>
            เข้าสู่ระบบเพื่อเข้าถึงทุกฟีเจอร์
          </Typography>
        </Box>

        {/* Form */}
        <Box sx={{ px: 4, pb: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, bgcolor: "rgba(239,68,68,0.1)", color: "#fca5a5", "& .MuiAlert-icon": { color: "#ef4444" } }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2, bgcolor: "rgba(34,197,94,0.1)", color: "#86efac", "& .MuiAlert-icon": { color: "#22c55e" } }}>
              {success}
            </Alert>
          )}

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
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={textFieldSx}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: "#a3a3a3" }}
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 2.5,
                mb: 1.5,
                py: 1.2,
                bgcolor: "#fbbf24",
                color: "#000",
                fontWeight: 700,
                fontSize: "0.95rem",
                borderRadius: 1.5,
                "&:hover": { bgcolor: "#f59e0b" },
                "&.Mui-disabled": { bgcolor: "#a38520", color: "#555" },
              }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: "#555" }} /> : "เข้าสู่ระบบ"}
            </Button>
          </Box>

          <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.1)", "& .MuiDivider-wrapper": { color: "#a3a3a3", fontSize: "0.8rem" } }}>
            หรือ
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            sx={{
              py: 1.1,
              color: "#fafafa",
              borderColor: "rgba(255,255,255,0.15)",
              borderRadius: 1.5,
              fontWeight: 500,
              "&:hover": { borderColor: "#fbbf24", bgcolor: "rgba(251,191,36,0.06)" },
            }}
          >
            ดำเนินการผ่าน Google
          </Button>

          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Typography variant="body2" sx={{ color: "#a3a3a3" }}>
              ยังไม่มีบัญชี?{" "}
              <Link
                href="/auth/register"
                onClick={onClose}
                style={{ color: "#fbbf24", textDecoration: "none", fontWeight: 600 }}
              >
                สมัครสมาชิก
              </Link>
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

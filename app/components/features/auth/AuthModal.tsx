"use client";

import { useState, useEffect } from "react";
import { markPendingSocialAuth, signIn, syncClientSession } from "@/lib/auth-client";
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
import AlternateEmailRoundedIcon from "@mui/icons-material/AlternateEmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (open) {
      setError("");
      setUsername("");
      setPassword("");
      setShowPassword(false);
      setLoading(false);
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
        await syncClientSession();
        onSuccess?.();
        onClose();
        router.refresh();
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      markPendingSocialAuth(callbackUrl);
      await signIn.social({ provider: "google", callbackURL: callbackUrl });
      onClose();
    } catch {
      setLoading(false);
      setError("ไม่สามารถเชื่อมต่อ Google ได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const textFieldSx = {
    "& .MuiInputLabel-root": { color: "#6f6f6f", fontWeight: 400 },
    "& .MuiOutlinedInput-root": {
      color: "#fafafa",
      bgcolor: "#1f1f1f",
      borderRadius: 2,
      fontSize: "0.95rem",
      "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
      "&:hover fieldset": { borderColor: "rgba(251,191,36,0.35)" },
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
          overflow: "hidden",
          bgcolor: "#111111",
          color: "#fafafa",
          borderRadius: 2,
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 22px 60px rgba(0,0,0,0.52)",
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box
          sx={{
            position: "relative",
            px: { xs: 3, sm: 4 },
            pt: { xs: 2.4, sm: 2.8 },
            pb: { xs: 1.5, sm: 1.8 },
          }}
        >
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              position: "absolute",
              top: 14,
              right: 14,
              color: "#8a8a8a",
              border: "1px solid rgba(255,255,255,0.08)",
              bgcolor: "rgba(255,255,255,0.02)",
              borderRadius: 1.5,
              "&:hover": { color: "#fafafa", bgcolor: "rgba(255,255,255,0.05)" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          <Box sx={{ pr: 6 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1.2 }}>
              <Image
                src="/logo.svg"
                alt="MAGGA"
                width={84}
                height={28}
                style={{ width: "auto", height: "28px" }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            </Box>

            <Typography variant="h5" fontWeight={600} sx={{ mb: 0.55, letterSpacing: -0.12, lineHeight: 1.18 }}>
              ยินดีต้อนรับกลับ
            </Typography>
            <Typography variant="body2" sx={{ color: "#8f8f8f", maxWidth: 320, lineHeight: 1.55, fontWeight: 400, fontSize: "0.92rem" }}>
              เข้าสู่ระบบเพื่อใช้งานโปรไฟล์ ความคิดเห็น และการตั้งค่าของคุณต่อเนื่อง
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: { xs: 3, sm: 4 }, pb: { xs: 3, sm: 3.4 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2, bgcolor: "rgba(239,68,68,0.12)", color: "#fca5a5", "& .MuiAlert-icon": { color: "#ef4444" } }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSignIn}>
            <Typography variant="caption" sx={{ color: "#c8c8c8", fontWeight: 500, letterSpacing: 0.1 }}>
              ชื่อผู้ใช้ หรือ อีเมล
            </Typography>
            <TextField
              required
              fullWidth
              placeholder="username หรือ you@example.com"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{
                ...textFieldSx,
                mt: 0.65,
                mb: 1.5,
                "& .MuiOutlinedInput-root": { ...textFieldSx["& .MuiOutlinedInput-root"], minHeight: 52 },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AlternateEmailRoundedIcon sx={{ color: "#6b6b6b", fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
            />

            <Typography variant="caption" sx={{ color: "#c8c8c8", fontWeight: 500, letterSpacing: 0.1 }}>
              รหัสผ่าน
            </Typography>
            <TextField
              required
              fullWidth
              placeholder="กรอกรหัสผ่านของคุณ"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{
                ...textFieldSx,
                mt: 0.65,
                "& .MuiOutlinedInput-root": { ...textFieldSx["& .MuiOutlinedInput-root"], minHeight: 52 },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockRoundedIcon sx={{ color: "#6b6b6b", fontSize: 18 }} />
                  </InputAdornment>
                ),
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
                mt: 2,
                mb: 1.6,
                py: 1.05,
                bgcolor: "#fbbf24",
                color: "#000",
                fontWeight: 700,
                fontSize: "0.95rem",
                borderRadius: 2,
                letterSpacing: 0,
                boxShadow: "none",
                "&:hover": { bgcolor: "#f59e0b", boxShadow: "none" },
                "&.Mui-disabled": { bgcolor: "#a38520", color: "#555" },
              }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: "#555" }} /> : "เข้าสู่ระบบ"}
            </Button>
          </Box>

          <Divider sx={{ my: 2.1, borderColor: "rgba(255,255,255,0.07)", "& .MuiDivider-wrapper": { color: "#767676", fontSize: "0.8rem" } }}>
            หรือ
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon sx={{ fontSize: 22 }} />}
            onClick={handleGoogleLogin}
            disabled={loading}
            sx={{
              py: 0.98,
              color: "#fafafa",
              borderColor: "rgba(255,255,255,0.12)",
              borderRadius: 2,
              fontWeight: 500,
              fontSize: "0.95rem",
              bgcolor: "rgba(255,255,255,0.02)",
              "&:hover": { borderColor: "#fbbf24", bgcolor: "rgba(251,191,36,0.06)" },
            }}
          >
            {loading ? "กำลังดำเนินการ..." : "ดำเนินการผ่าน Google"}
          </Button>

          <Box
            sx={{
              mt: 3,
              pt: 2,
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 0.7,
              flexWrap: "wrap",
            }}
          >
            <Typography variant="body2" sx={{ color: "#9a9a9a", fontSize: "0.92rem" }}>
              ยังไม่มีบัญชี?
            </Typography>
            <Typography variant="body2" sx={{ fontSize: "0.92rem" }}>
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

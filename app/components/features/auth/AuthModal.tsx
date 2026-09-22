"use client";

import { useState, useEffect } from "react";
import { signIn, syncClientSession } from "@/lib/auth-client";
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
import { maggaColors } from "@/lib/design-tokens";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  callbackUrl?: string;
  notice?: string;
}

export default function AuthModal({
  open,
  onClose,
  onSuccess,
  callbackUrl = "/",
  notice,
}: AuthModalProps) {
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
        if (onSuccess) {
          onSuccess();
        } else {
          onClose();
        }
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
      await signIn.social({ provider: "google", callbackURL: callbackUrl });
      onClose();
    } catch {
      setLoading(false);
      setError("ไม่สามารถเชื่อมต่อ Google ได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const textFieldSx = {
    "& .MuiInputLabel-root": { color: "#a1a1aa", fontWeight: 500 },
    "& .MuiOutlinedInput-root": {
      color: "#f4f4f5",
      bgcolor: "#101012",
      borderRadius: "10px",
      fontSize: "0.95rem",
      "& fieldset": { borderColor: "rgba(255, 255, 255, 0.08)" },
      "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.16)" },
      "&.Mui-focused fieldset": { borderColor: "#d97706", boxShadow: "0 0 0 1px rgba(217, 119, 6, 0.25)" },
    },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        backdrop: { sx: { backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" } },
        paper: {
          elevation: 0,
          sx: {
            overflow: "hidden",
            backgroundImage: "none !important",
            bgcolor: "#16171a !important",
            color: "#f4f4f5",
            borderRadius: "14px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.75)",
          },
        }
      }}>
      <DialogContent sx={{ p: 0 }}>
        <Box
          sx={{
            position: "relative",
            px: { xs: 3, sm: 4 },
            pt: { xs: 3, sm: 3.5 },
            pb: { xs: 1.5, sm: 2 },
          }}
        >
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: "#a1a1aa",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              bgcolor: "rgba(255,255,255,0.02)",
              borderRadius: "8px",
              width: 32,
              height: 32,
              "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.06)" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          <Box sx={{ pr: 5 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1.25 }}>
              <Image
                src="/logo.svg"
                alt="MAGGA"
                width={84}
                height={28}
                style={{ width: "auto", height: "28px" }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            </Box>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 0.5,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                color: "#f4f4f5",
              }}>
              ยินดีต้อนรับกลับ
            </Typography>
            <Typography variant="body2" sx={{ color: "#a1a1aa", maxWidth: 320, lineHeight: 1.55, fontSize: "0.9rem" }}>
              เข้าสู่ระบบเพื่อใช้งานโปรไฟล์ ความคิดเห็น และการตั้งค่าของคุณต่อเนื่อง
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: { xs: 3, sm: 4 }, pb: { xs: 3, sm: 3.5 } }}>
          {notice && (
            <Alert
              severity="info"
              sx={{
                mb: 2,
                borderRadius: "10px",
                bgcolor: "rgba(56,189,248,0.12)",
                color: "#bae6fd",
                "& .MuiAlert-icon": { color: "#38bdf8" },
              }}
            >
              {notice}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: "10px", bgcolor: "rgba(239,68,68,0.12)", color: "#fca5a5", "& .MuiAlert-icon": { color: "#ef4444" } }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSignIn}>
            <Typography id="auth-modal-username-label" variant="caption" sx={{ color: "#a1a1aa", fontWeight: 500, letterSpacing: "0.01em", fontSize: "0.82rem" }}>
              ชื่อผู้ใช้ หรือ อีเมล
            </Typography>
            <TextField
              required
              fullWidth
              aria-labelledby="auth-modal-username-label"
              placeholder="username หรือ you@example.com"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{
                ...textFieldSx,
                mt: 0.65,
                mb: 1.75,
                "& .MuiOutlinedInput-root": { ...textFieldSx["& .MuiOutlinedInput-root"], minHeight: 48 },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <AlternateEmailRoundedIcon sx={{ color: "#71717a", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }
              }}
            />

            <Typography id="auth-modal-password-label" variant="caption" sx={{ color: "#a1a1aa", fontWeight: 500, letterSpacing: "0.01em", fontSize: "0.82rem" }}>
              รหัสผ่าน
            </Typography>
            <TextField
              required
              fullWidth
              aria-labelledby="auth-modal-password-label"
              placeholder="กรอกรหัสผ่านของคุณ"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{
                ...textFieldSx,
                mt: 0.65,
                "& .MuiOutlinedInput-root": { ...textFieldSx["& .MuiOutlinedInput-root"], minHeight: 48 },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockRoundedIcon sx={{ color: "#71717a", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                        sx={{ color: "#71717a" }}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 2.25,
                mb: 1.5,
                py: 1.1,
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                color: "#0f0f14",
                fontWeight: 700,
                fontSize: "0.95rem",
                borderRadius: "10px",
                letterSpacing: 0,
                boxShadow: "0 2px 10px rgba(217, 119, 6, 0.2)",
                textTransform: "none",
                "&:hover": {
                  background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                  boxShadow: "0 4px 16px rgba(217, 119, 6, 0.35)",
                },
                "&.Mui-disabled": { bgcolor: "rgba(217, 119, 6, 0.4)", color: "rgba(0, 0, 0, 0.5)" },
              }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: "#000" }} /> : "เข้าสู่ระบบ"}
            </Button>
          </Box>

          <Divider sx={{ my: 2, borderColor: "rgba(255, 255, 255, 0.08)", "& .MuiDivider-wrapper": { color: "#71717a", fontSize: "0.8rem" } }}>
            หรือ
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon sx={{ fontSize: 20 }} />}
            onClick={handleGoogleLogin}
            disabled={loading}
            sx={{
              py: 1.05,
              color: "#f4f4f5",
              borderColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "0.92rem",
              bgcolor: "rgba(255,255,255,0.03)",
              textTransform: "none",
              "&:hover": { borderColor: "rgba(255, 255, 255, 0.2)", bgcolor: "rgba(255, 255, 255, 0.06)" },
            }}
          >
            {loading ? "กำลังดำเนินการ..." : "ดำเนินการผ่าน Google"}
          </Button>

          <Box
            sx={{
              mt: 2.75,
              pt: 2,
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 0.7,
              flexWrap: "wrap",
            }}
          >
            <Typography variant="body2" sx={{ color: "#a1a1aa", fontSize: "0.9rem" }}>
              ยังไม่มีบัญชี?
            </Typography>
            <Typography variant="body2" sx={{ fontSize: "0.9rem" }}>
              <Link
                href="/auth/register"
                onClick={onClose}
                style={{ color: "#f59e0b", textDecoration: "none", fontWeight: 600 }}
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

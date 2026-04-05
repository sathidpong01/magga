"use client";

import { useState, Suspense } from "react";
import {
  signIn,
  signUp,
  syncClientSession,
} from "@/lib/auth-client";
import { isValidCallbackUrl } from "@/lib/auth-helpers";
import { finalizeEmailRegistration } from "@/lib/register-flow";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Divider,
  CircularProgress,
  IconButton,
  InputAdornment,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

function getPasswordStrength(pass: string): number {
  if (!pass) return 0;
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[a-z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  return score;
}

function getStrengthLabel(score: number): { label: string; color: string } {
  if (score === 0) return { label: "", color: "#404040" };
  if (score <= 2) return { label: "อ่อนแอ", color: "#ef4444" };
  if (score === 3) return { label: "พอใช้ได้", color: "#eab308" };
  return { label: "แข็งแกร่ง", color: "#22c55e" };
}

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

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = isValidCallbackUrl(searchParams.get("callbackUrl"));

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strengthScore = getPasswordStrength(formData.password);
  const { label: strengthLabel, color: strengthColor } = getStrengthLabel(strengthScore);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (formData.password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    setLoading(true);
    try {
      const res = await signUp.email({
        name: formData.username,
        email: formData.email,
        password: formData.password,
      });

      if (res.error) {
        throw new Error(res.error.message || "สมัครสมาชิกไม่สำเร็จ");
      }

      const registrationResult = await finalizeEmailRegistration({
        email: formData.email,
        password: formData.password,
        callbackUrl,
        signInEmail: signIn.email,
        syncSession: syncClientSession,
      });

      router.push(registrationResult.redirectTo);
      if (!registrationResult.manualSignInRequired) {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
        px: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 440,
          bgcolor: "#171717",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 3,
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box sx={{ pt: 4, pb: 2, px: 4, textAlign: "center" }}>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2.5 }}>
            <Image
              src="/logo.svg"
              alt="MAGGA"
              width={100}
              height={32}
              style={{ width: "auto", height: "32px" }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          </Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
            ยินดีต้อนรับสู่ MAGGA
          </Typography>
          <Typography variant="body2" sx={{ color: "#a3a3a3" }}>
            สร้างบัญชีใหม่เพื่อเริ่มต้นใช้งาน
          </Typography>
        </Box>

        {/* Form */}
        <Box sx={{ px: 4, pb: 4 }}>
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2, bgcolor: "rgba(239,68,68,0.1)", color: "#fca5a5", "& .MuiAlert-icon": { color: "#ef4444" } }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="ชื่อผู้ใช้"
              autoFocus
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="อีเมล"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="รหัสผ่าน"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              sx={textFieldSx}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: "#a3a3a3" }}>
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Password Strength Meter */}
            {formData.password && (
              <Box sx={{ mt: 1, mb: 1 }}>
                <Box sx={{ display: "flex", gap: 0.5, mb: 0.5 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <Box
                      key={i}
                      sx={{
                        height: 3,
                        flex: 1,
                        borderRadius: 1,
                        bgcolor: strengthScore > i ? strengthColor : "#404040",
                        transition: "background-color 0.3s ease",
                      }}
                    />
                  ))}
                </Box>
                {strengthLabel && (
                  <Typography variant="caption" sx={{ color: strengthColor }}>
                    ความปลอดภัย: {strengthLabel}
                  </Typography>
                )}
              </Box>
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              label="ยืนยันรหัสผ่าน"
              type={showConfirm ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              sx={textFieldSx}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" sx={{ color: "#a3a3a3" }}>
                      {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
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
              {loading ? <CircularProgress size={22} sx={{ color: "#555" }} /> : "สมัครสมาชิก"}
            </Button>
          </Box>

          <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.1)", "& .MuiDivider-wrapper": { color: "#a3a3a3", fontSize: "0.8rem" } }}>
            หรือ
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={() => {
              void signIn.social({ provider: "google", callbackURL: callbackUrl });
            }}
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
              มีบัญชีอยู่แล้ว?{" "}
              <Link href="/auth/signin" style={{ color: "#fbbf24", textDecoration: "none", fontWeight: 600 }}>
                เข้าสู่ระบบ
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: "100vh", bgcolor: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress sx={{ color: "#fbbf24" }} />
        </Box>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

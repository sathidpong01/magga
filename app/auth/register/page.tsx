"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Divider,
  CircularProgress,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Auto login after register
      const loginRes = await signIn("credentials", {
        redirect: false,
        username: formData.username,
        password: formData.password,
      });

      if (loginRes?.ok) {
        router.push(callbackUrl);
        router.refresh();
      } else {
        router.push(
          `/auth/signin?callbackUrl=${encodeURIComponent(
            callbackUrl
          )}&registered=true`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl });
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper
        elevation={3}
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: 4,
          backgroundColor: "#171717",
          color: "#fafafa",
        }}
      >
        <Typography component="h1" variant="h5" gutterBottom>
          Create Account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ mt: 1, width: "100%" }}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            label="Username"
            autoFocus
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
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
            margin="normal"
            required
            fullWidth
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
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
            margin="normal"
            required
            fullWidth
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
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

          {/* Password Strength Meter */}
          {formData.password && (
            <Box sx={{ mt: 1, mb: 2 }}>
              <Box sx={{ display: "flex", gap: 0.5, mb: 0.5 }}>
                {[...Array(4)].map((_, index) => {
                  const strength = ((pass) => {
                    let score = 0;
                    if (pass.length === 0) return 0;
                    if (pass.length >= 8) score += 1;
                    if (/[A-Z]/.test(pass)) score += 1;
                    if (/[a-z]/.test(pass)) score += 1;
                    if (/[0-9]/.test(pass)) score += 1;
                    return score; // Max 4
                  })(formData.password);

                  let color = "#404040";
                  if (strength > index) {
                    if (strength <= 2) color = "#ef4444"; // Weak
                    else if (strength === 3) color = "#eab308"; // Good
                    else color = "#22c55e"; // Strong
                  }

                  return (
                    <Box
                      key={index}
                      sx={{
                        height: 4,
                        flex: 1,
                        bgcolor: color,
                        borderRadius: 1,
                        transition: "all 0.3s ease",
                      }}
                    />
                  );
                })}
              </Box>
              <Typography variant="caption" sx={{ color: "#a3a3a3" }}>
                Strength:{" "}
                {((pass) => {
                  let score = 0;
                  if (pass.length === 0) return "";
                  if (pass.length >= 8) score += 1;
                  if (/[A-Z]/.test(pass)) score += 1;
                  if (/[a-z]/.test(pass)) score += 1;
                  if (/[0-9]/.test(pass)) score += 1;

                  if (score <= 2) return "Weak";
                  if (score === 3) return "Good";
                  return "Strong";
                })(formData.password)}
              </Typography>
            </Box>
          )}

          <TextField
            margin="normal"
            required
            fullWidth
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
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
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              mt: 3,
              mb: 2,
              bgcolor: "#fbbf24",
              color: "#000",
              "&:hover": { bgcolor: "#f59e0b" },
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Sign Up"
            )}
          </Button>

          <Divider sx={{ my: 2, borderColor: "#404040" }}>OR</Divider>

          <Button
            fullWidth
            type="button"
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={() => {
              console.log("Initiating Google Login from Register...");
              handleGoogleLogin();
            }}
            sx={{
              mb: 2,
              color: "#fafafa",
              borderColor: "#404040",
              "&:hover": {
                borderColor: "#fbbf24",
                bgcolor: "rgba(251, 191, 36, 0.08)",
              },
            }}
          >
            Sign up with Google
          </Button>

          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Link
              href="/auth/signin"
              style={{ color: "#fbbf24", textDecoration: "none" }}
            >
              Already have an account? Sign In
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <Container
          component="main"
          maxWidth="xs"
          sx={{ mt: 8, display: "flex", justifyContent: "center" }}
        >
          <CircularProgress sx={{ color: "#fbbf24" }} />
        </Container>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

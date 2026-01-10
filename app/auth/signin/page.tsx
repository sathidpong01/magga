"use client";

import { useState, Suspense, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Divider,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import Link from "next/link";

function SignInForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error">("success");
  const [modalMessage, setModalMessage] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    if (result?.error) {
      setModalType("error");
      // Display the actual error message with remaining attempts
      setModalMessage(result.error);
      setModalOpen(true);
    } else if (result?.ok) {
      setModalType("success");
      setModalMessage("Login Successful!");
      setModalOpen(true);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (modalOpen && modalType === "success") {
      timer = setTimeout(() => {
        handleCloseModal();
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [modalOpen, modalType]);

  const handleCloseModal = () => {
    setModalOpen(false);
    if (modalType === "success") {
      router.replace(callbackUrl);
      router.refresh();
    }
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
          backgroundColor: "#171717", // Neutral 900
          color: "#fafafa",
        }}
      >
        <Typography component="h1" variant="h5">
          Admin Sign In
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username or Email"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{
              "& .MuiInputLabel-root": { color: "#a3a3a3" }, // Neutral 400
              "& .MuiOutlinedInput-root": {
                color: "#fafafa",
                "& fieldset": { borderColor: "#404040" }, // Neutral 700
                "&:hover fieldset": { borderColor: "#fbbf24" }, // Amber-400
                "&.Mui-focused fieldset": { borderColor: "#fbbf24" }, // Amber-400
              },
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{
              "& .MuiInputLabel-root": { color: "#a3a3a3" }, // Neutral 400
              "& .MuiOutlinedInput-root": {
                color: "#fafafa",
                "& fieldset": { borderColor: "#404040" }, // Neutral 700
                "&:hover fieldset": { borderColor: "#fbbf24" }, // Amber-400
                "&.Mui-focused fieldset": { borderColor: "#fbbf24" }, // Amber-400
              },
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              mb: 2,
              bgcolor: "#fbbf24",
              color: "#000",
              "&:hover": { bgcolor: "#f59e0b" },
            }}
          >
            Sign In
          </Button>

          <Divider sx={{ my: 2, borderColor: "#404040" }}>OR</Divider>

          <Button
            fullWidth
            type="button"
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={async () => {
              console.log("Initiating Google Login...");
              try {
                const result = await signIn("google", { callbackUrl });
                console.log("Google Login Result:", result);
              } catch (error) {
                console.error("Google Login Error:", error);
              }
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
            Sign in with Google
          </Button>

          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Link
              href="/auth/register"
              style={{ color: "#fbbf24", textDecoration: "none" }}
            >
              Don't have an account? Sign Up
            </Link>
          </Box>
        </Box>
      </Paper>

      {/* Success/Failure Modal */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {modalType === "success" ? "Success" : "Login Failed"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {modalMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default function SignIn() {
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
      <SignInForm />
    </Suspense>
  );
}

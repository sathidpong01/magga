"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Snackbar, Alert, AlertColor } from "@mui/material";

interface Toast {
  id: string;
  message: string;
  severity: AlertColor;
}

interface ToastContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, severity: AlertColor) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast = { id, message, severity };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const showSuccess = useCallback(
    (message: string) => showToast(message, "success"),
    [showToast]
  );
  const showError = useCallback(
    (message: string) => showToast(message, "error"),
    [showToast]
  );
  const showInfo = useCallback(
    (message: string) => showToast(message, "info"),
    [showToast]
  );
  const showWarning = useCallback(
    (message: string) => showToast(message, "warning"),
    [showToast]
  );

  const handleClose = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider
      value={{ showSuccess, showError, showInfo, showWarning }}
    >
      {children}
      {toasts.map((toast, index) => (
        <Snackbar
          key={toast.id}
          open={true}
          autoHideDuration={4000}
          onClose={() => handleClose(toast.id)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          sx={{
            bottom: { xs: 16 + index * 70, md: 24 + index * 70 }, // Stack toasts
            right: { xs: 16, md: 24 },
          }}
        >
          <Alert
            onClose={() => handleClose(toast.id)}
            severity={toast.severity}
            variant="filled"
            sx={{
              width: "100%",
              minWidth: 300,
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              "& .MuiAlert-icon": { fontSize: 24 },
              // Custom colors for better contrast
              ...(toast.severity === "success" && {
                bgcolor: "#10b981",
                color: "#fff",
                "& .MuiAlert-icon": { color: "#fff" },
              }),
              ...(toast.severity === "error" && {
                bgcolor: "#ef4444",
                color: "#fff",
                "& .MuiAlert-icon": { color: "#fff" },
              }),
              ...(toast.severity === "warning" && {
                bgcolor: "#f59e0b",
                color: "#fff",
                "& .MuiAlert-icon": { color: "#fff" },
              }),
              ...(toast.severity === "info" && {
                bgcolor: "#3b82f6",
                color: "#fff",
                "& .MuiAlert-icon": { color: "#fff" },
              }),
            }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export default ToastContext;

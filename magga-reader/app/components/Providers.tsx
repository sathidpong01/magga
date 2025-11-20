"use client";

import { SessionProvider } from "next-auth/react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import { Kanit } from "next/font/google";

const kanit = Kanit({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin", "thai"],
  display: "swap",
});

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0B0F19", // Deep dark blue/black
      paper: "#111827",   // Rich dark grey
    },
    primary: {
      main: "#8b5cf6",    // Violet 500
    },
    secondary: {
      main: "#10b981",    // Emerald 500
    },
    text: {
      primary: "#F3F4F6", // Gray 100
      secondary: "#9CA3AF", // Gray 400
    },
  },
  typography: {
    fontFamily: kanit.style.fontFamily,
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(11, 15, 25, 0.8)", // Semi-transparent background
          backdropFilter: "blur(12px)",            // Glass effect
          boxShadow: "none",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none", // Disable default MUI gradient overlay
          backgroundColor: "#111827",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none", // Modern buttons usually don't use uppercase
          fontWeight: 500,
        },
        containedPrimary: {
          boxShadow: "0 4px 14px 0 rgba(139, 92, 246, 0.39)", // Violet glow
          "&:hover": {
            boxShadow: "0 6px 20px rgba(139, 92, 246, 0.23)",
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: "#374151 #0B0F19",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            backgroundColor: "#0B0F19",
            width: "8px",
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: "#374151",
            minHeight: 24,
            border: "2px solid #0B0F19",
          },
          "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
            backgroundColor: "#6B7280",
          },
          "&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active": {
            backgroundColor: "#6B7280",
          },
          "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#6B7280",
          },
        },
      },
    },
  },
});

type Props = {
  children?: React.ReactNode;
};

export const Providers = ({ children }: Props) => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  );
};

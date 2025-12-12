"use client";

import { SessionProvider } from "next-auth/react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { ToastProvider } from "@/app/contexts/ToastContext";

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
      default: "#0a0a0a", // Neutral Black
      paper: "#171717",   // Neutral 900
    },
    primary: {
      main: "#8b5cf6",    // Violet 500
    },
    secondary: {
      main: "#10b981",    // Emerald 500
    },
    text: {
      primary: "#fafafa", // Neutral 50
      secondary: "#a3a3a3", // Neutral 400
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
          backgroundColor: "transparent",
          backdropFilter: "none",
          boxShadow: "none",
          borderBottom: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#171717", // Neutral 900
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
        },
        containedPrimary: {
          boxShadow: "0 4px 14px 0 rgba(139, 92, 246, 0.39)",
          "&:hover": {
            boxShadow: "0 6px 20px rgba(139, 92, 246, 0.23)",
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: "#262626 #0a0a0a", // Neutral 800 / Neutral Black
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            backgroundColor: "#0a0a0a",
            width: "8px",
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: "#262626", // Neutral 800
            minHeight: 24,
            border: "2px solid #0a0a0a",
          },
          "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
            backgroundColor: "#525252", // Neutral 600
          },
          "&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active": {
            backgroundColor: "#525252",
          },
          "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#525252",
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
    <AppRouterCacheProvider>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <SessionProvider>
          <ToastProvider>{children}</ToastProvider>
        </SessionProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
};

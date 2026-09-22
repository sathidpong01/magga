"use client";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ToastProvider } from "@/app/contexts/ToastContext";
import { AdsProvider } from "@/app/components/features/ads";
import { maggaColors, maggaRadii } from "@/lib/design-tokens";

// NOTE: Font is already loaded in layout.tsx, use CSS font-family string here
// to avoid loading the font twice which causes CLS issues

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: maggaColors.background,
      paper: maggaColors.surface,
    },
    primary: {
      main: maggaColors.archiveGold,
    },
    secondary: {
      main: maggaColors.trustEmerald,
    },
    text: {
      primary: maggaColors.textPrimary,
      secondary: maggaColors.textSecondary,
    },
  },
  typography: {
    fontFamily: "'Kanit', sans-serif",
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: maggaRadii.lg,
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
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
          backgroundColor: "#16171a",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: maggaColors.charcoalSurface,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          variants: [
            {
              props: { variant: "contained", color: "primary" },
              style: {
                boxShadow: "none",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(217, 119, 6, 0.3)",
                },
              },
            },
          ],
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: "0.85rem",
          borderRadius: 6,
          margin: "2px 6px",
          transition: "background-color 0.15s ease, color 0.15s ease",
          "&.Mui-selected": {
            backgroundColor: "rgba(217, 119, 6, 0.15) !important",
            color: "#f59e0b",
            fontWeight: 600,
            "&:hover": {
              backgroundColor: "rgba(217, 119, 6, 0.22) !important",
            },
          },
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.06)",
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: "#18181b",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 10,
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.5)",
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: `${maggaColors.ironSurface} ${maggaColors.midnightCanvas}`,
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            backgroundColor: maggaColors.midnightCanvas,
            width: "8px",
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: maggaColors.ironSurface,
            minHeight: 24,
            border: `2px solid ${maggaColors.midnightCanvas}`,
          },
          "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus":
            {
              backgroundColor: "#525252",
            },
          "&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active":
            {
              backgroundColor: "#525252",
            },
          "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover":
            {
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
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <ToastProvider>
          <AdsProvider>{children}</AdsProvider>
        </ToastProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
};

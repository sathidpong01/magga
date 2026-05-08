"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import { maggaColors, maggaRadii } from "@/lib/design-tokens";

const dashboardTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: maggaColors.midnightCanvas,
      paper: maggaColors.charcoalSurface,
    },
    text: {
      primary: maggaColors.textPrimary,
      secondary: maggaColors.textSecondary,
    },
    primary: {
      main: maggaColors.archiveGold,
    },
  },
  shape: {
    borderRadius: maggaRadii.md,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        input: {
          color: "#fafafa",
          WebkitTextFillColor: "#fafafa",
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          color: "#fafafa",
          WebkitTextFillColor: "#fafafa",
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          borderRadius: 8,
          color: "#fafafa",
          WebkitTextFillColor: "#fafafa",
        },
        icon: {
          color: "rgba(255,255,255,0.72)",
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "#a3a3a3",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
        },
      },
    },
  },
});

export default function DashboardThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ThemeProvider theme={dashboardTheme}>{children}</ThemeProvider>;
}

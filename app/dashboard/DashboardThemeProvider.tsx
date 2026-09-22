"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import { maggaColors, maggaRadii } from "@/lib/design-tokens";

const dashboardTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: maggaColors.background,
      paper: maggaColors.surface,
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
    borderRadius: 10,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: "none",
          fontWeight: 600,
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
          borderRadius: 10,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: "rgba(255, 255, 255, 0.02)",
          "& fieldset": {
            borderColor: "rgba(255, 255, 255, 0.08)",
          },
          "&:hover fieldset": {
            borderColor: "rgba(255, 255, 255, 0.16)",
          },
          "&.Mui-focused fieldset": {
            borderColor: maggaColors.archiveGold,
          },
        },
        input: {
          color: maggaColors.textPrimary,
          WebkitTextFillColor: maggaColors.textPrimary,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          color: maggaColors.textPrimary,
          WebkitTextFillColor: maggaColors.textPrimary,
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          borderRadius: 10,
          color: maggaColors.textPrimary,
          WebkitTextFillColor: maggaColors.textPrimary,
        },
        icon: {
          color: maggaColors.textSecondary,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: maggaColors.textSecondary,
          "&.Mui-focused": {
            color: maggaColors.archiveGold,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
          backgroundColor: maggaColors.surface,
          border: `1px solid ${maggaColors.border}`,
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

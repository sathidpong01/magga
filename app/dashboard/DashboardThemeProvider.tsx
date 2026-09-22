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
      contrastText: "#0f0f14",
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
          backgroundColor: maggaColors.surface,
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
      variants: [
        {
          props: { variant: "contained", color: "primary" },
          style: {
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            color: "#0f0f14",
            fontWeight: 800,
            boxShadow: "0 4px 14px rgba(217, 119, 6, 0.35)",
            "&:hover": {
              background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
              boxShadow: "0 6px 20px rgba(217, 119, 6, 0.45)",
            },
            "&.Mui-disabled": {
              background: "rgba(255, 255, 255, 0.06)",
              color: "rgba(255, 255, 255, 0.25)",
              boxShadow: "none",
            },
          },
        },
      ],
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: maggaColors.archiveGold,
          height: 3,
          borderRadius: "3px 3px 0 0",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 700,
          color: maggaColors.textMuted,
          "&.Mui-selected": {
            color: maggaColors.archiveGold,
          },
        },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          color: maggaColors.textMuted,
          fontWeight: 700,
          borderRadius: 8,
          "&.Mui-selected": {
            backgroundColor: `${maggaColors.archiveGold} !important`,
            color: "#0f0f14 !important",
            fontWeight: 800,
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          "&.Mui-checked": {
            color: maggaColors.archiveGold,
            "& + .MuiSwitch-track": {
              backgroundColor: maggaColors.archiveGold,
              opacity: 0.5,
            },
          },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          color: maggaColors.textSecondary,
        },
        selectIcon: {
          color: maggaColors.textSecondary,
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

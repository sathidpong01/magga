"use client";
import GlobalStyles from "@mui/material/GlobalStyles";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import { maggaThemeTypography, maggaTypographyComponents } from "@/lib/typography";
import { maggaColors } from "@/lib/design-tokens";

const dashboardTheme = createTheme({
  typography: maggaThemeTypography,
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
    ...maggaTypographyComponents,
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
            fontWeight: 700,
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
          color: maggaColors.textSecondary,
          opacity: 1,
          "&.Mui-selected": {
            color: maggaColors.archiveGoldHover,
          },
        },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          color: maggaColors.textMuted,
          fontWeight: 500,
          borderRadius: 8,
          "&.Mui-selected": {
            backgroundColor: `${maggaColors.archiveGold} !important`,
            color: "#0f0f14 !important",
            fontWeight: 600,
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
        ...maggaTypographyComponents.MuiChip.styleOverrides,
        root: {
          ...maggaTypographyComponents.MuiChip.styleOverrides.root,
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
        ...maggaTypographyComponents.MuiInputBase.styleOverrides,
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
          ...maggaTypographyComponents.MuiInputLabel.styleOverrides.root,
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
  return (
    <ThemeProvider theme={dashboardTheme}>
      <GlobalStyles
        styles={{
          ".MuiIconButton-root": { minWidth: 44, minHeight: 44 },
          ".MuiButton-root": { minHeight: 44 },
          ".MuiPagination-root .MuiPaginationItem-root": {
            minWidth: 44,
            minHeight: 44,
          },
          ".admin-work-table": { tableLayout: "fixed", minWidth: 760 },
          ".admin-work-table th": {
            minWidth: "0 !important",
            width: "auto !important",
          },
          ".admin-work-table td": {
            overflowWrap: "anywhere",
            padding: "10px 8px",
          },
          ".admin-work-table td:last-child": {
            position: "sticky",
            right: 0,
            background: maggaColors.surface,
            zIndex: 1,
          },
          ".admin-work-table td:last-child .MuiStack-root": {
            flexWrap: "wrap",
            gap: 2,
          },
          ".admin-work-table th:first-child, .admin-work-table td:first-child":
            { width: 64 },
          "@media(max-width:899.95px)": {
            ".admin-work-table": {
              display: "block",
              minWidth: "0 !important",
              width: "100%",
            },
            ".admin-work-table colgroup": { display: "none" },
            ".admin-work-table thead": {position:"absolute",width:1,height:1,overflow:"hidden",clipPath:"inset(50%)",whiteSpace:"nowrap"},
            ".admin-work-table tbody": { display: "block" },
            ".admin-work-table tbody tr": {
              display: "block",
              padding: "12px",
              borderBottom: `1px solid ${maggaColors.border}`,
            },
            ".admin-work-table tbody td": {
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "4px 0 !important",
              border: "0 !important",
              width: "100% !important",
              minWidth: 0,
            },
            ".admin-work-table td[data-label]::before": {
              content: "attr(data-label)",
              color: maggaColors.textSecondary,
              fontSize: ".8rem",
              minWidth: 64,
              flexShrink: 0,
            },
            ".admin-work-table td:last-child": {
              position: "static",
              background: "transparent",
            },
          },
        }}
      />
      {children}
    </ThemeProvider>
  );
}

import Link from "next/link";
import {
  alpha,
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { PaperProps, SxProps, Theme } from "@mui/material";

export const dashboardTokens = {
  bg: "#0a0a0a",
  surface: "#141414",
  surfaceAlt: "#171717",
  surfaceMuted: "#111111",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.14)",
  text: "#fafafa",
  textMuted: "#a3a3a3",
  textSoft: "#737373",
  accent: "#fbbf24",
  accentStrong: "#f59e0b",
  accentSoft: "rgba(251,191,36,0.14)",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#38bdf8",
};

export const dashboardRadii = {
  surface: 1.5,
  inset: 1.2,
  field: 1.1,
  button: 1.5,
  compact: 0.9,
  badge: 1.5,
};

export const dashboardSurfaceSx: SxProps<Theme> = {
  bgcolor: dashboardTokens.surface,
  color: dashboardTokens.text,
  borderRadius: dashboardRadii.surface,
  border: `1px solid ${dashboardTokens.border}`,
  backgroundImage:
    "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
  boxShadow: "0 20px 40px rgba(0,0,0,0.28)",
};

export const dashboardInsetSurfaceSx: SxProps<Theme> = {
  bgcolor: dashboardTokens.surfaceAlt,
  borderRadius: dashboardRadii.inset,
  border: `1px solid ${dashboardTokens.border}`,
};

export const dashboardTextFieldSx: SxProps<Theme> = {
  "& .MuiInputLabel-root": {
    color: dashboardTokens.textMuted,
    fontWeight: 600,
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: dashboardTokens.accent,
  },
  "& .MuiOutlinedInput-root": {
    borderRadius: dashboardRadii.field,
    bgcolor: dashboardTokens.surfaceMuted,
    color: dashboardTokens.text,
    "& fieldset": {
      borderColor: dashboardTokens.border,
    },
    "&:hover fieldset": {
      borderColor: dashboardTokens.borderStrong,
    },
    "&.Mui-focused fieldset": {
      borderColor: dashboardTokens.accent,
    },
  },
  "& .MuiFilledInput-root": {
    borderRadius: dashboardRadii.field,
    bgcolor: alpha(dashboardTokens.text, 0.04),
    color: dashboardTokens.text,
    "&:before, &:after": {
      display: "none",
    },
    "&:hover": {
      bgcolor: alpha(dashboardTokens.text, 0.06),
    },
    "&.Mui-focused": {
      bgcolor: alpha(dashboardTokens.text, 0.07),
      boxShadow: `0 0 0 1px ${alpha(dashboardTokens.accent, 0.55)}`,
    },
  },
  "& .MuiFormHelperText-root": {
    color: dashboardTokens.textSoft,
    ml: 0,
  },
};

export const dashboardSelectSx: SxProps<Theme> = {
  borderRadius: dashboardRadii.field,
  bgcolor: dashboardTokens.surfaceMuted,
  color: dashboardTokens.text,
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: dashboardTokens.border,
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: dashboardTokens.borderStrong,
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: dashboardTokens.accent,
  },
};

export const dashboardPrimaryButtonSx: SxProps<Theme> = {
  bgcolor: dashboardTokens.accent,
  color: "#120d00",
  fontWeight: 800,
  borderRadius: dashboardRadii.button,
  px: 2.25,
  boxShadow: "0 10px 28px rgba(251,191,36,0.18)",
  "&:hover": {
    bgcolor: dashboardTokens.accentStrong,
  },
};

export const dashboardSecondaryButtonSx: SxProps<Theme> = {
  color: dashboardTokens.text,
  borderColor: dashboardTokens.borderStrong,
  bgcolor: alpha(dashboardTokens.text, 0.02),
  borderRadius: dashboardRadii.button,
  fontWeight: 700,
  "&:hover": {
    borderColor: alpha(dashboardTokens.accent, 0.5),
    color: dashboardTokens.accent,
    bgcolor: alpha(dashboardTokens.accent, 0.08),
  },
};

export const dashboardGhostButtonSx: SxProps<Theme> = {
  color: dashboardTokens.textMuted,
  borderRadius: dashboardRadii.button,
  fontWeight: 700,
  "&:hover": {
    color: dashboardTokens.text,
    bgcolor: alpha(dashboardTokens.text, 0.06),
  },
};

export const dashboardDangerButtonSx: SxProps<Theme> = {
  bgcolor: dashboardTokens.danger,
  color: "#fff",
  borderRadius: dashboardRadii.button,
  fontWeight: 800,
  "&:hover": {
    bgcolor: "#dc2626",
  },
};

export const dashboardDialogPaperSx: SxProps<Theme> = {
  ...dashboardSurfaceSx,
  borderRadius: dashboardRadii.surface,
  backgroundImage: "none",
};

export const dashboardTableContainerSx: SxProps<Theme> = {
  ...dashboardSurfaceSx,
  overflow: "hidden",
  backgroundImage: "none",
  boxShadow: "none",
};

export const dashboardTableHeadCellSx: SxProps<Theme> = {
  color: dashboardTokens.textMuted,
  fontWeight: 700,
  fontSize: "0.78rem",
  letterSpacing: "0.02em",
  borderBottom: `1px solid ${dashboardTokens.border}`,
  bgcolor: alpha(dashboardTokens.text, 0.02),
};

export const dashboardTableRowSx: SxProps<Theme> = {
  "& td": {
    borderBottom: `1px solid ${alpha(dashboardTokens.text, 0.05)}`,
  },
  "&:hover": {
    bgcolor: alpha(dashboardTokens.text, 0.02),
  },
};

type HeaderAction = {
  href?: string;
  label: string;
  onClick?: () => void;
  variant?: "contained" | "outlined" | "text";
};

export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: HeaderAction;
  children?: React.ReactNode;
}) {
  const actionNode = action ? (
    action.href ? (
      <Button
        component={Link}
        href={action.href}
        variant={action.variant ?? "contained"}
        sx={
          action.variant === "outlined"
            ? dashboardSecondaryButtonSx
            : action.variant === "text"
              ? dashboardGhostButtonSx
              : dashboardPrimaryButtonSx
        }
      >
        {action.label}
      </Button>
    ) : (
      <Button
        onClick={action.onClick}
        variant={action.variant ?? "contained"}
        sx={
          action.variant === "outlined"
            ? dashboardSecondaryButtonSx
            : action.variant === "text"
              ? dashboardGhostButtonSx
              : dashboardPrimaryButtonSx
        }
      >
        {action.label}
      </Button>
    )
  ) : null;

  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", md: "flex-end" }}
      spacing={2}
      sx={{ mb: 3.5 }}
    >
      <Box>
        {eyebrow ? (
          <Typography
            sx={{
              color: dashboardTokens.accent,
              fontSize: "0.8rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              mb: 0.75,
            }}
          >
            {eyebrow}
          </Typography>
        ) : null}
        <Typography
          variant="h4"
          sx={{
            color: dashboardTokens.text,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
          }}
        >
          {title}
        </Typography>
        {description ? (
          <Typography
            sx={{
              mt: 1,
              color: dashboardTokens.textMuted,
              maxWidth: 720,
              lineHeight: 1.6,
            }}
          >
            {description}
          </Typography>
        ) : null}
      </Box>
      {children || actionNode ? (
        <Stack
          direction="row"
          spacing={1.25}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
        >
          {children}
          {actionNode}
        </Stack>
      ) : null}
    </Stack>
  );
}

export function DashboardSurface({
  children,
  sx,
  ...props
}: PaperProps) {
  return (
    <Paper
      elevation={0}
      sx={[dashboardSurfaceSx, { p: 3 }, sx] as SxProps<Theme>}
      {...props}
    >
      {children}
    </Paper>
  );
}

export function DashboardSectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography
        variant="h6"
        sx={{ color: dashboardTokens.text, fontWeight: 800, mb: 0.75 }}
      >
        {title}
      </Typography>
      {description ? (
        <Typography sx={{ color: dashboardTokens.textSoft, lineHeight: 1.6 }}>
          {description}
        </Typography>
      ) : null}
    </Box>
  );
}

export function DashboardStat({
  label,
  value,
  icon,
  href,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  href?: string;
}) {
  const content = (
    <DashboardSurface
      sx={{
        p: 2.25,
        height: "100%",
        transition: "transform 0.2s ease, border-color 0.2s ease",
        "&:hover": href
          ? {
              transform: "translateY(-2px)",
              borderColor: alpha(dashboardTokens.accent, 0.5),
            }
          : undefined,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: dashboardRadii.compact,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: dashboardTokens.accentSoft,
            color: dashboardTokens.accent,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography
            sx={{
              color: dashboardTokens.text,
              fontSize: "1.6rem",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
            }}
          >
            {typeof value === "number" ? value.toLocaleString() : value}
          </Typography>
          <Typography sx={{ color: dashboardTokens.textMuted, mt: 0.5 }}>
            {label}
          </Typography>
        </Box>
      </Stack>
    </DashboardSurface>
  );

  return href ? (
    <Link href={href} style={{ textDecoration: "none", display: "block" }}>
      {content}
    </Link>
  ) : (
    content
  );
}

export function DashboardEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <DashboardSurface
      sx={{
        py: 7,
        px: { xs: 3, md: 5 },
        textAlign: "center",
      }}
    >
      <Typography
        variant="h6"
        sx={{ color: dashboardTokens.text, fontWeight: 800, mb: 1 }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          color: dashboardTokens.textMuted,
          maxWidth: 520,
          mx: "auto",
          lineHeight: 1.7,
        }}
      >
        {description}
      </Typography>
      {action ? (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          {action}
        </Box>
      ) : null}
    </DashboardSurface>
  );
}

export function DashboardStatusBadge({
  status,
}: {
  status: string | null | undefined;
}) {
  const normalized = (status || "").toUpperCase();
  const statusMap: Record<
    string,
    { label: string; color: string; background: string; border: string }
  > = {
    PENDING: {
      label: "รอตรวจ",
      color: dashboardTokens.accent,
      background: alpha(dashboardTokens.accent, 0.12),
      border: alpha(dashboardTokens.accent, 0.28),
    },
    UNDER_REVIEW: {
      label: "กำลังตรวจ",
      color: dashboardTokens.warning,
      background: alpha(dashboardTokens.warning, 0.12),
      border: alpha(dashboardTokens.warning, 0.28),
    },
    APPROVED: {
      label: "อนุมัติแล้ว",
      color: dashboardTokens.success,
      background: alpha(dashboardTokens.success, 0.12),
      border: alpha(dashboardTokens.success, 0.28),
    },
    REJECTED: {
      label: "ไม่ผ่าน",
      color: dashboardTokens.danger,
      background: alpha(dashboardTokens.danger, 0.12),
      border: alpha(dashboardTokens.danger, 0.28),
    },
    ACTIVE: {
      label: "เปิดใช้งาน",
      color: dashboardTokens.success,
      background: alpha(dashboardTokens.success, 0.12),
      border: alpha(dashboardTokens.success, 0.28),
    },
    INACTIVE: {
      label: "ปิดใช้งาน",
      color: dashboardTokens.textMuted,
      background: alpha(dashboardTokens.text, 0.06),
      border: alpha(dashboardTokens.text, 0.12),
    },
    HIDDEN: {
      label: "ซ่อนอยู่",
      color: dashboardTokens.textMuted,
      background: alpha(dashboardTokens.text, 0.06),
      border: alpha(dashboardTokens.text, 0.12),
    },
    PUBLISHED: {
      label: "เผยแพร่แล้ว",
      color: dashboardTokens.info,
      background: alpha(dashboardTokens.info, 0.12),
      border: alpha(dashboardTokens.info, 0.28),
    },
    BANNED: {
      label: "ระงับอยู่",
      color: dashboardTokens.danger,
      background: alpha(dashboardTokens.danger, 0.12),
      border: alpha(dashboardTokens.danger, 0.28),
    },
  };

  const config = statusMap[normalized] || {
    label: status || "ไม่ทราบสถานะ",
    color: dashboardTokens.textMuted,
    background: alpha(dashboardTokens.text, 0.06),
    border: alpha(dashboardTokens.text, 0.12),
  };

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 1.25,
        py: 0.55,
        borderRadius: dashboardRadii.badge,
        fontSize: "0.74rem",
        fontWeight: 800,
        lineHeight: 1,
        color: config.color,
        bgcolor: config.background,
        border: `1px solid ${config.border}`,
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
      }}
    >
      {config.label}
    </Box>
  );
}

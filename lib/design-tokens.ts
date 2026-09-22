export const maggaColors = {
  background: "#141416",
  midnightCanvas: "#0a0a0a",
  surface: "#1e1e22",
  charcoalSurface: "#1e1e22",
  surfaceElevated: "#26262c",
  surfaceAlt: "#262626",
  surfaceMuted: "#141416",
  ironSurface: "#262626",
  border: "rgba(255,255,255,0.08)",
  borderSubtle: "rgba(255,255,255,0.05)",
  borderStrong: "rgba(255,255,255,0.14)",
  softDivider: "#404040",
  textPrimary: "#f4f4f5",
  textSecondary: "#a1a1aa",
  textMuted: "#71717a",
  archiveGold: "#d97706",
  archiveGoldHover: "#f59e0b",
  archiveGoldSoft: "rgba(217, 119, 6, 0.15)",
  archiveGoldBorder: "rgba(217, 119, 6, 0.35)",
  adminGold: "#FABF06",
  fandomViolet: "#d97706",
  trustEmerald: "#10b981",
  dangerRed: "#ef4444",
} as const;

export const maggaRadii = {
  sm: 4,
  md: 8,
  card: 10,
  lg: 16,
  pill: 50,
} as const;

export const maggaShadows = {
  cardHoverLift: "0 8px 24px -4px rgba(0, 0, 0, 0.5)",
  cardAmberHoverLift: "0 8px 24px -4px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(217, 119, 6, 0.35)",
  goldGlow: "0 0 20px rgba(217, 119, 6, 0.3)",
  authPanelDepth: "0 25px 60px rgba(0,0,0,0.5)",
  thumbnailLift: "0 4px 12px rgba(0,0,0,0.3)",
} as const;

export const maggaMotion = {
  standardFeedback: "0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  quickState: "0.2s ease",
} as const;

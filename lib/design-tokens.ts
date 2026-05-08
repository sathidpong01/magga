export const maggaColors = {
  midnightCanvas: "#0a0a0a",
  charcoalSurface: "#171717",
  ironSurface: "#262626",
  softDivider: "#404040",
  textPrimary: "#fafafa",
  textSecondary: "#a3a3a3",
  textMuted: "#737373",
  archiveGold: "#fbbf24",
  archiveGoldHover: "#f59e0b",
  adminGold: "#FABF06",
  fandomViolet: "#8b5cf6",
  trustEmerald: "#10b981",
  dangerRed: "#ef4444",
} as const;

export const maggaRadii = {
  sm: 4,
  md: 8,
  lg: 16,
  pill: 50,
} as const;

export const maggaShadows = {
  cardHoverLift: "0 12px 24px -8px rgba(0, 0, 0, 0.4)",
  goldGlow: "0 0 20px rgba(251, 191, 36, 0.4)",
  authPanelDepth: "0 25px 60px rgba(0,0,0,0.5)",
  thumbnailLift: "0 4px 12px rgba(0,0,0,0.3)",
} as const;

export const maggaMotion = {
  standardFeedback: "0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  quickState: "0.2s ease",
} as const;

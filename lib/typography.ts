import { maggaTypography } from "./design-tokens";

// Shared by both MUI themes. Component roles can override these defaults.
export const maggaThemeTypography = {
  fontFamily: maggaTypography.fontFamily,
  fontWeightRegular: maggaTypography.weight.body,
  fontWeightMedium: maggaTypography.weight.label,
  fontWeightBold: maggaTypography.weight.heading,
  allVariants: { lineHeight: maggaTypography.lineHeight, letterSpacing: "normal" },
  h1: { fontWeight: 700 },
  h2: { fontWeight: 700 },
  h3: { fontWeight: 600 },
  h4: { fontWeight: 600 },
  h5: { fontWeight: 600 },
  h6: { fontWeight: 600 },
  subtitle1: { fontWeight: 500 },
  subtitle2: { fontWeight: 600 },
  body1: { fontWeight: 400 },
  body2: { fontWeight: 400 },
  caption: { fontWeight: 400 },
  overline: { fontWeight: 500 },
  button: { fontWeight: 600 },
};


// InputBase and Chip have their own line metrics outside typography variants.
export const maggaTypographyComponents = {
  MuiInputBase: {
    styleOverrides: { root: { lineHeight: maggaTypography.lineHeight } },
  },
  MuiInputLabel: {
    styleOverrides: { root: { lineHeight: maggaTypography.lineHeight, fontWeight: 500 } },
  },
  MuiChip: {
    styleOverrides: {
      root: { minHeight: 28, fontWeight: 600 },
      label: { lineHeight: maggaTypography.lineHeight },
    },
  },
};

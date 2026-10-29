import localFont from "next/font/local";

// One source file serves every weight, width and slant. Keep this server-only
// loader out of client themes; they consume --font-magga through design tokens.
export const ekkamaiVibe = localFont({
  src: "../public/fonts/ekkamai-vibe-variable.woff2",
  variable: "--font-magga",
  weight: "100 700",
  style: "oblique 0deg 10deg",
  display: "swap",
  preload: true,
  fallback: ["Tahoma", "Arial", "sans-serif"],
  declarations: [{ prop: "font-stretch", value: "75% 125%" }],
});

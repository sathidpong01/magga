const CHIP_HUES = Array.from({ length: 26 }, (_, index) => (18 + index * 31) % 360);

function getLetterBucket(label: string) {
  const trimmed = label.trim();
  const latinMatch = trimmed.match(/[A-Za-z]/);

  if (latinMatch) {
    return latinMatch[0].toUpperCase().charCodeAt(0) - 65;
  }

  const fallback = Array.from(trimmed).reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  );

  return fallback % CHIP_HUES.length;
}

export function getMetadataChipSx(label: string) {
  const bucket = getLetterBucket(label);
  const hue = CHIP_HUES[bucket];

  return {
    bgcolor: `hsla(${hue} 92% 58% / 0.14)`,
    color: `hsl(${hue} 100% 72%)`,
    border: `1px solid hsla(${hue} 92% 62% / 0.42)`,
    boxShadow: `inset 0 1px 0 hsla(${hue} 100% 86% / 0.08)`,
    fontWeight: 700,
    borderRadius: 1,
    letterSpacing: "0.01em",
    "& .MuiChip-deleteIcon": {
      color: `hsla(${hue} 100% 84% / 0.72)`,
      "&:hover": {
        color: `hsl(${hue} 100% 86%)`,
      },
    },
  };
}

import { maggaColors } from "@/lib/design-tokens";
export function getMetadataChipSx(_label: string) {
  return {
    bgcolor: maggaColors.archiveGoldSoft,
    color: maggaColors.archiveGoldHover,
    border: `1px solid ${maggaColors.border}`,
    fontWeight: 700, borderRadius: 1, letterSpacing: "0.01em",
    "& .MuiChip-deleteIcon": { color: maggaColors.archiveGold, "&:hover": { color: maggaColors.archiveGoldHover } },
  };
}

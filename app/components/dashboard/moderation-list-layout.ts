/** Utility columns stay bounded; content receives the remaining desktop space. */
export const commentsColumns=[52,"18%",undefined,"20%",156,144] as const;
export const submissionsColumns=[80,undefined,"25%",156,140,88] as const;
export const advertisementsColumns=[96,undefined,132,160,112,164] as const;
export const moderationTableSx={
  "@media(min-width:900px)": { minWidth: 900 },
  "& td": { overflowWrap: "anywhere" },
  "& td:last-child": { whiteSpace: "normal" },
};

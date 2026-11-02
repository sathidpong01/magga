import { maggaColors } from "@/lib/design-tokens";

// Utility columns stay fixed. A bounded title share leaves the remaining width
// to tags; CSS calc percentages on table col elements are treated as auto.
export const mangaColumnWidths = [
  52,
  80,
  "22%",
  100,
  undefined,
  128,
  140,
  160,
] as const;
export const mangaListPageSx = {
  display: "flex",
  flexDirection: "column",
  gap: 2.5,
} as const;
export const mangaListShellSx = {
  bgcolor: maggaColors.surface,
  border: `1px solid ${maggaColors.border}`,
  borderRadius: "12px",
  backgroundImage: "none",
  boxShadow: "0 8px 30px -4px rgba(0,0,0,0.4)",
  p: { xs: 2, md: 2.5 },
};
export const mangaTableSx = {
  tableLayout: "fixed",
  minWidth: 1040,
  "@media(min-width:900px)": {
    minWidth: 1040,
    "& th, & td": { px: "8px !important" },
    "& th:first-of-type, & td:first-of-type": { px: "0 !important" },
    "& tbody tr": { height: 96 },
    "& td:last-child .MuiStack-root": { flexWrap: "nowrap", gap: "4px" },
  },
};
// Use the content width, including the sidebar's effect, rather than device width.
export const mangaWideQuery = "@container manga-list (min-width: 1040px)";
export const mangaCompactSx = {
  display: "block",
  [mangaWideQuery]: { display: "none" },
};
export const mangaWideSx = {
  display: "none",
  [mangaWideQuery]: { display: "block" },
};
export const mangaCollectionSx = {
  containerType: "inline-size",
  containerName: "manga-list",
  minWidth: 0,
};
export const mangaCompactRowSx = {
  px: { xs: 1.5, sm: 2 },
  py: 1,
  minHeight: 180,
  borderBottom: `1px solid ${maggaColors.border}`,
  "&:last-child": { borderBottom: 0 },
};
export const mangaSorts = [
  { value: "", label: "ล่าสุด" },
  { value: "title", label: "ชื่อเรื่อง" },
  { value: "views", label: "ยอดอ่าน" },
];
export const mangaStatuses = [
  { value: "", label: "ทั้งหมด" },
  { value: "published", label: "เผยแพร่" },
  { value: "scheduled", label: "ตั้งเวลาแล้ว" },
  { value: "hidden", label: "ซ่อน / ฉบับร่าง" },
];

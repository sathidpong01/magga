export type DirectoryKind="authors"|"users";
export const directoryColumns={
  authors: ["24%",undefined,112],
  users: ["32%",undefined,124,128,132,112],
} as const;
export const directoryLabels={
  authors: ["ผู้แต่ง","ช่องทาง","จัดการ"],
  users: ["ผู้ใช้","อีเมล","บทบาท","สถิติ","สมัครเมื่อ","จัดการ"],
};
export const directoryTableSx={
  "@media(min-width:900px)": {
    "& th, & td": { px: "12px !important" },
    "& td:last-child .MuiStack-root": { gap: "4px",flexWrap: "nowrap" },
    "& tbody tr": { height: 72 },
  },
};
export const userSorts=[{ value: "",label: "ล่าสุด" },{ value: "name",label: "ชื่อ" }];
export const userStatuses=[{ value: "",label: "ทั้งหมด" },{ value: "admin",label: "แอดมิน" },{ value: "user",label: "สมาชิก" },{ value: "banned",label: "ระงับ" }];

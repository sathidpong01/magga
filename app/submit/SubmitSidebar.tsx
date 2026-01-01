"use client";

import CollapsibleSidebar, {
  SidebarItem,
} from "@/app/components/layout/CollapsibleSidebar";
import AddBoxIcon from "@mui/icons-material/AddBox";
import ListAltIcon from "@mui/icons-material/ListAlt";
import HomeIcon from "@mui/icons-material/Home";

export default function SubmitSidebar() {
  const menuItems: SidebarItem[] = [
    { text: "ฝากลงมังงะ", href: "/submit", icon: <AddBoxIcon /> },
    {
      text: "รายการที่ฝากลง",
      href: "/submit/my-submissions",
      icon: <ListAltIcon />,
    },
  ];

  const bottomItems: SidebarItem[] = [
    { text: "กลับหน้าหลัก", href: "/", icon: <HomeIcon /> },
  ];

  return (
    <CollapsibleSidebar
      title="ฝากลงมังงะ"
      items={menuItems}
      bottomItems={bottomItems}
      storageKey="submit-sidebar-collapsed"
    />
  );
}

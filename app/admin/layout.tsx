"use client";

import CollapsibleSidebar, {
  SidebarItem,
} from "@/app/components/layout/CollapsibleSidebar";
import { Box } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CategoryIcon from "@mui/icons-material/Category";
import HomeIcon from "@mui/icons-material/Home";
import InboxIcon from "@mui/icons-material/Inbox";
import CommentIcon from "@mui/icons-material/Comment";
import CampaignIcon from "@mui/icons-material/Campaign";
import PersonIcon from "@mui/icons-material/Person";
import PeopleIcon from "@mui/icons-material/People";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems: SidebarItem[] = [
    { text: "แดชบอร์ด", href: "/admin", icon: <DashboardIcon /> },
    { text: "การฝากลง", href: "/admin/submissions", icon: <InboxIcon /> },
    { text: "คอมเมนต์", href: "/admin/comments", icon: <CommentIcon /> },
    { text: "โฆษณา", href: "/admin/advertisements", icon: <CampaignIcon /> },
    { text: "หมวดหมู่", href: "/admin/metadata", icon: <CategoryIcon /> },
    { text: "ผู้แต่ง", href: "/admin/authors", icon: <PersonIcon /> },
    { text: "ผู้ใช้", href: "/admin/users", icon: <PeopleIcon /> },
  ];

  const bottomItems: SidebarItem[] = [
    { text: "กลับหน้าหลัก", href: "/", icon: <HomeIcon /> },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        bgcolor: "#0a0a0a",
        minHeight: "100vh",
        color: "#fafafa",
      }}
    >
      <CollapsibleSidebar
        title="Magga Admin"
        items={menuItems}
        bottomItems={bottomItems}
        storageKey="admin-sidebar-collapsed"
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2.5,
          bgcolor: "#0a0a0a",
          backgroundImage: "none",
          maxWidth: "1200px",
          mx: "auto",
          width: "100%",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

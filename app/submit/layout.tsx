"use client";

import CollapsibleSidebar, { SidebarItem } from "@/app/components/layout/CollapsibleSidebar";
import { Box } from "@mui/material";
import AddBoxIcon from '@mui/icons-material/AddBox';
import ListAltIcon from '@mui/icons-material/ListAlt';
import HomeIcon from '@mui/icons-material/Home';
import EditIcon from '@mui/icons-material/Edit';

export default function SubmitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems: SidebarItem[] = [
    { text: 'ฝากลงมังงะ', href: '/submit', icon: <AddBoxIcon /> },
    { text: 'รายการที่ฝากลง', href: '/submit/my-submissions', icon: <ListAltIcon /> },
  ];

  const bottomItems: SidebarItem[] = [
    { text: 'กลับหน้าหลัก', href: '/', icon: <HomeIcon /> },
  ];

  return (
    <Box sx={{ display: "flex", bgcolor: "#0a0a0a", minHeight: "100vh", color: "#fafafa" }}>
      <CollapsibleSidebar
        title="ฝากลงมังงะ"
        items={menuItems}
        bottomItems={bottomItems}
        storageKey="submit-sidebar-collapsed"
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

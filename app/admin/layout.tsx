"use client";

import LinkListItemButton from "@/app/components/ui/LinkListItemButton";
import SignOutButton from "./SignOutButton";
import { usePathname } from "next/navigation";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
} from "@mui/material";
import DashboardIcon from '@mui/icons-material/Dashboard';
import CategoryIcon from '@mui/icons-material/Category';
import HomeIcon from '@mui/icons-material/Home';
import InboxIcon from '@mui/icons-material/Inbox';

const drawerWidth = 220;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const menuItems = [
    { text: 'แดชบอร์ด', href: '/admin', icon: <DashboardIcon /> },
    { text: 'การฝากลง', href: '/admin/submissions', icon: <InboxIcon /> },
    { text: 'หมวดหมู่', href: '/admin/metadata', icon: <CategoryIcon /> },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <Box sx={{ display: "flex", bgcolor: "#0a0a0a", minHeight: "100vh", color: "#fafafa" }}>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#171717",
            color: "#fafafa",
            borderRight: "1px solid rgba(255, 255, 255, 0.08)",
          },
        }}
        PaperProps={{
          sx: {
            backgroundColor: "#171717 !important",
            backgroundImage: "none !important",
            borderRight: "1px solid rgba(255, 255, 255, 0.08)",
            color: "#fafafa",
          }
        }}
        variant="permanent"
        elevation={0}
        anchor="left"
      >
        <Toolbar sx={{ minHeight: '56px !important' }}>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, color: '#8b5cf6', fontSize: '1rem' }}>
            Magga Admin
          </Typography>
        </Toolbar>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />
        <Box component="nav" aria-label="Admin navigation">
          <List sx={{ px: 1.5, mt: 1.5, gap: 0.5, display: 'flex', flexDirection: 'column' }}>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <LinkListItemButton
                  href={item.href}
                  sx={{
                    borderRadius: 0.5,
                    py: 0.75,
                    bgcolor: isActive(item.href) ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    borderLeft: isActive(item.href) ? '3px solid #8b5cf6' : '3px solid transparent',
                    "&:hover": { bgcolor: isActive(item.href) ? 'rgba(139, 92, 246, 0.2)' : "rgba(255, 255, 255, 0.05)" },
                  }}
                >
                  <ListItemIcon sx={{ color: isActive(item.href) ? "#8b5cf6" : "#a3a3a3", minWidth: 36 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontWeight: isActive(item.href) ? 600 : 500,
                      color: isActive(item.href) ? "#fafafa" : "#d4d4d4",
                      fontSize: '0.875rem'
                    }}
                  />
                </LinkListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
        
        <Box sx={{ mt: 'auto', px: 1.5, pb: 1 }}>
          <LinkListItemButton 
            href="/"
            sx={{
              borderRadius: 0.5,
              py: 0.75,
              color: "#fbbf24", 
              "&:hover": { bgcolor: "rgba(251, 191, 36, 0.1)" },
            }}
          >
            <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}><HomeIcon /></ListItemIcon>
            <ListItemText 
              primary="กลับหน้าหลัก" 
              primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }}
            />
          </LinkListItemButton>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />
        <Box sx={{ p: 1.5 }}>
          <SignOutButton />
        </Box>
      </Drawer>
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

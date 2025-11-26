import Link from "next/link";
import SignOutButton from "./SignOutButton";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
} from "@mui/material";
import DashboardIcon from '@mui/icons-material/Dashboard';
import CategoryIcon from '@mui/icons-material/Category';

const drawerWidth = 240;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const menuItems = [
    { text: 'Dashboard', href: '/admin', icon: <DashboardIcon /> },
    { text: 'Classifications', href: '/admin/metadata', icon: <CategoryIcon /> },
  ];

  return (
    <Box sx={{ display: "flex", bgcolor: "#0f172a", minHeight: "100vh", color: "#f8fafc" }}>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#0f172a", // Unified background color
            color: "#f8fafc",
            borderRight: "1px solid #1e293b",
          },
        }}
        PaperProps={{
          sx: {
            backgroundColor: "#0f172a !important",
            backgroundImage: "none !important",
            borderRight: "1px solid #1e293b",
            color: "#f8fafc",
          }
        }}
        variant="permanent"
        elevation={0}
        anchor="left"
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, color: '#6366f1' }}>
            Magga Admin
          </Typography>
        </Toolbar>
        <Divider sx={{ borderColor: '#1e293b' }} />
        <List sx={{ px: 2, mt: 2, gap: 0.5, display: 'flex', flexDirection: 'column' }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                href={item.href}
                sx={{
                  borderRadius: 1,
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)" },
                }}
              >
                <ListItemIcon sx={{ color: "#94a3b8", minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider sx={{ mt: 'auto', borderColor: '#1e293b' }} />
        <Box sx={{ p: 2 }}>
          <SignOutButton />
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          bgcolor: "#0f172a",
          backgroundImage: "none" // Remove MUI gradient overlay
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

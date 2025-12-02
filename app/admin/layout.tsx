import LinkListItemButton from "@/app/components/LinkListItemButton";
import SignOutButton from "./SignOutButton";
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
    <Box sx={{ display: "flex", bgcolor: "#0a0a0a", minHeight: "100vh", color: "#fafafa" }}>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#171717", // Neutral 900
            color: "#fafafa",
            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
          },
        }}
        PaperProps={{
          sx: {
            backgroundColor: "#171717 !important",
            backgroundImage: "none !important",
            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
            color: "#fafafa",
          }
        }}
        variant="permanent"
        elevation={0}
        anchor="left"
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, color: '#8b5cf6' }}>
            Magga Admin
          </Typography>
        </Toolbar>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <List sx={{ px: 2, mt: 2, gap: 0.5, display: 'flex', flexDirection: 'column' }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <LinkListItemButton
                href={item.href}
                sx={{
                  borderRadius: 1,
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)" },
                }}
              >
                <ListItemIcon sx={{ color: "#a3a3a3", minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
              </LinkListItemButton>
            </ListItem>
          ))}
        </List>
        
        <Box sx={{ mt: 'auto', px: 2, pb: 1 }}>
          <LinkListItemButton 
            href="/"
            sx={{
              borderRadius: 1,
              color: "#fbbf24", 
              "&:hover": { bgcolor: "rgba(251, 191, 36, 0.1)" },
            }}
          >
            <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}><HomeIcon /></ListItemIcon>
            <ListItemText 
              primary="Back to Home" 
              primaryTypographyProps={{ fontWeight: 600 }}
            />
          </LinkListItemButton>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <Box sx={{ p: 2 }}>
          <SignOutButton />
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          bgcolor: "#0a0a0a", // Neutral Black
          backgroundImage: "none" // Remove MUI gradient overlay
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

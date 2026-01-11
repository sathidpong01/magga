"use client";

import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import SecurityIcon from "@mui/icons-material/Security";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LanguageIcon from "@mui/icons-material/Language";

export default function Sidebar() {
  return (
    <Box sx={{ width: "100%", maxWidth: 280 }}>
      <Typography variant="caption" color="text.secondary" sx={{ px: 2, mb: 1, display: "block", fontWeight: "bold" }}>
        GENERAL SETTINGS
      </Typography>
      <List sx={{ mb: 2 }}>
        <ListItem disablePadding>
          <ListItemButton selected sx={{ 
            borderRadius: 1, 
            "&.Mui-selected": { bgcolor: "rgba(251, 191, 36, 0.1)", color: "#fbbf24" },
            "&.Mui-selected:hover": { bgcolor: "rgba(251, 191, 36, 0.2)" }
          }}>
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText primary="Account" primaryTypographyProps={{ fontWeight: "medium" }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton disabled sx={{ borderRadius: 1 }}>
            <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>
              <NotificationsIcon />
            </ListItemIcon>
            <ListItemText primary="Notification" secondary="(Coming Soon)" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton disabled sx={{ borderRadius: 1 }}>
            <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>
              <LanguageIcon />
            </ListItemIcon>
            <ListItemText primary="Language & Region" secondary="(Coming Soon)" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
}

"use client";

import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import ArticleIcon from "@mui/icons-material/Article";
import Link from "next/link";

export default function DashboardSidebar() {
  return (
    <Paper sx={{ p: 2, bgcolor: "#171717", height: "100%" }}>
      <Typography variant="h6" sx={{ px: 2, mb: 2, fontWeight: "bold" }}>
        User Dashboard
      </Typography>
      <List>
        <ListItem disablePadding>
          <ListItemButton component={Link} href="/dashboard/submissions">
            <ListItemIcon>
              <ArticleIcon />
            </ListItemIcon>
            <ListItemText primary="My Submissions" />
          </ListItemButton>
        </ListItem>
      </List>
    </Paper>
  );
}

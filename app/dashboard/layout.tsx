import { Box, Container, Grid, Paper, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArticleIcon from '@mui/icons-material/Article';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, bgcolor: '#171717', height: '100%' }}>
            <Typography variant="h6" sx={{ px: 2, mb: 2, fontWeight: 'bold' }}>User Dashboard</Typography>
            <List>
              <ListItem disablePadding>
                <ListItemButton component={Link} href="/dashboard/submissions">
                  <ListItemIcon><ArticleIcon /></ListItemIcon>
                  <ListItemText primary="My Submissions" />
                </ListItemButton>
              </ListItem>
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={9}>
          {children}
        </Grid>
      </Grid>
    </Container>
  );
}

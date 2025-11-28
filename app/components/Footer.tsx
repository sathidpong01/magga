"use client";

import { Box, Container, Typography, Link, Button } from "@mui/material";
import NextLink from "next/link";
import { useTheme } from "@mui/material/styles";

export default function Footer() {
  const theme = useTheme();

  const backgroundColor =
    theme.palette.mode === "light" ? theme.palette.grey[200] : theme.palette.background.paper;

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: "auto",
        backgroundColor,
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {"Copyright © "}
            {new Date().getFullYear()}
            {" | "}
            <Link 
              href="https://www.facebook.com/nightsu9/" 
              target="_blank" 
              rel="noopener noreferrer"
              color="inherit"
              underline="hover"
              sx={{ fontWeight: 'medium' }}
            >
              Create by Nightsu ❤️
            </Link>
          </Typography>
          
          <Link
            component={NextLink}
            href="/changelog"
            underline="hover"
            sx={{ 
              color: '#fbbf24',
              fontWeight: 600,
              fontSize: '0.875rem',
              '&:hover': {
                color: '#fcd34d',
              }
            }}
          >
            Changelog
          </Link>
        </Box>
      </Container>
    </Box>
  );
}

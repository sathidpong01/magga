"use client";

import { Box, Container, Typography, Link, Button } from "@mui/material";
import NextLink from "next/link";
import { useSession, signIn } from "next-auth/react";
import { useTheme } from "@mui/material/styles";

export default function Footer() {
  const { data: session } = useSession();
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: "auto",
        backgroundColor: "#0a0a0a", // Dark background consistent with theme
        borderTop: "1px solid rgba(255,255,255,0.05)",
        color: "#a3a3a3"
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="inherit">
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
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
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

            {!session && (
              <Button 
                onClick={() => signIn()}
                variant="text" 
                size="small"
                sx={{ 
                  color: "#525252", 
                  fontSize: "0.75rem",
                  minWidth: "auto",
                  p: 0,
                  "&:hover": { color: "#a3a3a3", bgcolor: "transparent" }
                }}
              >
                Sign In
              </Button>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

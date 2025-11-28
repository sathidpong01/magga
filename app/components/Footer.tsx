"use client";

import { Box, Container, Typography, Link, Button } from "@mui/material";
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
          
          <Button
            href="/changelog"
            variant="contained"
            size="small"
            sx={{ 
              background: 'linear-gradient(45deg, #8b5cf6 30%, #ec4899 90%)',
              color: 'white',
              fontWeight: 'bold',
              boxShadow: '0 3px 5px 2px rgba(139, 92, 246, .3)',
              textTransform: 'none',
              px: 3,
              borderRadius: 50,
              '&:hover': {
                background: 'linear-gradient(45deg, #7c3aed 30%, #db2777 90%)',
              }
            }}
          >
            บันทึกการอัพเดท
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

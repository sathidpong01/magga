"use client";

import { Box, Container, Typography } from "@mui/material";
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
      <Container maxWidth="sm">
        <Typography variant="body2" color="text.secondary" align="center">
          {"Copyright © "}
          Magga Reader {new Date().getFullYear()}
          {"."}
        </Typography>
      </Container>
    </Box>
  );
}

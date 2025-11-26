"use client";

import Link from "next/link";
import { Box, Button, Container, Typography } from "@mui/material";
import { Home as HomeIcon } from "@mui/icons-material";

export default function NotFound() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0a", // Neutral Black
        color: "#fafafa", // Neutral 50
        textAlign: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Background decorative elements */}
      <Box
        sx={{
          position: "absolute",
          top: "10%",
          left: "5%",
          width: "300px",
          height: "300px",
          background: "radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, rgba(10, 10, 10, 0) 70%)",
          borderRadius: "50%",
          filter: "blur(40px)",
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "10%",
          right: "5%",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, rgba(10, 10, 10, 0) 70%)",
          borderRadius: "50%",
          filter: "blur(60px)",
          zIndex: 0,
        }}
      />

      <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontSize: { xs: "8rem", md: "12rem" },
            fontWeight: 900,
            lineHeight: 1,
            background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #b45309 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 0 20px rgba(251, 191, 36, 0.3)",
            mb: 2,
            fontFamily: "'Inter', sans-serif",
            letterSpacing: "-0.05em",
            animation: "glitch 1s linear infinite",
            "@keyframes glitch": {
              "2%, 64%": { transform: "translate(2px,0) skew(0deg)" },
              "4%, 60%": { transform: "translate(-2px,0) skew(0deg)" },
              "62%": { transform: "translate(0,0) skew(5deg)" },
            },
          }}
        >
          404
        </Typography>

        <Typography
          variant="h4"
          component="h2"
          sx={{
            fontWeight: 700,
            mb: 2,
            background: "linear-gradient(to right, #e5e5e5, #a3a3a3)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Lost in the Mangaverse?
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: "#a3a3a3",
            fontSize: "1.1rem",
            mb: 6,
            maxWidth: "600px",
            mx: "auto",
          }}
        >
          The chapter you are looking for hasn&apos;t been drawn yet, or it might have been deleted by the author.
        </Typography>

        <Link href="/" passHref style={{ textDecoration: "none" }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<HomeIcon />}
            sx={{
              bgcolor: "#fbbf24",
              color: "#0a0a0a",
              fontWeight: "bold",
              px: 4,
              py: 1.5,
              borderRadius: "50px",
              fontSize: "1.1rem",
              textTransform: "none",
              boxShadow: "0 0 20px rgba(251, 191, 36, 0.3)",
              transition: "all 0.3s ease",
              "&:hover": {
                bgcolor: "#f59e0b",
                transform: "translateY(-2px)",
                boxShadow: "0 0 30px rgba(251, 191, 36, 0.5)",
              },
            }}
          >
            Go Back Home
          </Button>
        </Link>
      </Container>
    </Box>
  );
}

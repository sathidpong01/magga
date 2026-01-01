import { Box } from "@mui/material";
import SubmitSidebar from "./SubmitSidebar";

// Server Component - no "use client"
export default function SubmitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        bgcolor: "#0a0a0a",
        minHeight: "100vh",
        color: "#fafafa",
      }}
    >
      <SubmitSidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2.5,
          bgcolor: "#0a0a0a",
          backgroundImage: "none",
          maxWidth: "1200px",
          mx: "auto",
          width: "100%",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

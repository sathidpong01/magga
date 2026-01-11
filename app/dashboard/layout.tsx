import { Box } from "@mui/material";
import UnifiedDashboardSidebar from "@/app/components/layout/UnifiedDashboardSidebar";

export default function DashboardLayout({
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
      <UnifiedDashboardSidebar />
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

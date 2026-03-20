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
        bgcolor: "#0B0B0B",
        minHeight: "100vh",
        color: "#fafafa",
      }}
    >
      <UnifiedDashboardSidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 2.5 },
          pt: { xs: `${56 + 16}px`, md: 2.5 },
          bgcolor: "#0B0B0B",
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

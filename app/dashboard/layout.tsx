import { Box } from "@mui/material";
import UnifiedDashboardSidebar from "@/app/components/layout/UnifiedDashboardSidebar";
import { dashboardTokens } from "@/app/components/dashboard/system";
import DashboardThemeProvider from "@/app/dashboard/DashboardThemeProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardThemeProvider>
      <Box
        sx={{
          display: "flex",
          bgcolor: dashboardTokens.bg,
          minHeight: "100vh",
          color: dashboardTokens.text,
          backgroundImage:
            "radial-gradient(circle at 10% 0%, rgba(217, 119, 6, 0.05), transparent 40%), radial-gradient(circle at 90% 10%, rgba(255, 255, 255, 0.02), transparent 30%)",
        }}
      >
        <UnifiedDashboardSidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            px: { xs: 2, sm: 3, md: 3.5, lg: 4 },
            py: { xs: 2, md: 2.5 },
            pt: { xs: `${56 + 16}px`, md: 2.5 },
            width: "100%",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: { xl: 1520 },
              mx: "auto",
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </DashboardThemeProvider>
  );
}

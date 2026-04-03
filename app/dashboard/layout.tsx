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
            "radial-gradient(circle at top left, rgba(251,191,36,0.08), transparent 28%), radial-gradient(circle at top right, rgba(255,255,255,0.04), transparent 24%)",
        }}
      >
        <UnifiedDashboardSidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            px: { xs: 2, md: 3 },
            py: { xs: 2, md: 3 },
            pt: { xs: `${56 + 20}px`, md: 3 },
            width: "100%",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: { xl: 1480 },
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

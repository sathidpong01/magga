"use client";

import { useParams, usePathname } from "next/navigation";
import { Box, Container } from "@mui/material";
import Header from "./Header";
import Footer from "./Footer";
import { AdContainer } from "@/app/components/features/ads";
import { isStandaloneRoute } from "./standalone-routes";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const isMangaPage = typeof params.mangaId === "string";
  const isStandalonePage = isStandaloneRoute(pathname);

  if (isStandalonePage) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      {/* โฆษณาใต้ Header */}
      <Container component="aside" aria-label="โฆษณาด้านบน" maxWidth="lg">
        <AdContainer placement="header" />
      </Container>
      <Container
        component="main"
        sx={{
          flexGrow: 1,
          py: 3,
          ...(isMangaPage && {
            px: { xs: 0, lg: 3 },
            maxWidth: { xs: "none", lg: "1200px" },
          }),
        }}
      >
        {children}
      </Container>
      {/* โฆษณาเหนือ Footer */}
      {!isMangaPage && (
        <Container component="aside" aria-label="โฆษณาด้านล่าง" maxWidth="lg">
          <AdContainer placement="footer" />
        </Container>
      )}
      <Footer />
    </Box>
  );
}

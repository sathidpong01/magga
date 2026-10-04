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
      <Container maxWidth="lg">
        <AdContainer placement="header" />
      </Container>
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        {children}
      </Container>
      {/* โฆษณาเหนือ Footer */}
      {!isMangaPage && (
        <Container maxWidth="lg">
          <AdContainer placement="footer" />
        </Container>
      )}
      <Footer />
    </Box>
  );
}

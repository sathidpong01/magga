import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/Providers";
import { Box, Container } from "@mui/material";
import Footer from "./components/Footer";
import Header from "./components/Header";
import AgeVerificationModal from "./components/AgeVerificationModal";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ErrorBoundary from "./components/ErrorBoundary";

const kanit = Kanit({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin", "thai"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Magga Reader",
  description: "A one-shot manga reader.",
  other: {
    rating: "mature",
    adult: "true",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={kanit.className}>
        <ErrorBoundary>
          <Providers>
            <AgeVerificationModal />
            <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
              <Header />
              <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
                {children}
              </Container>
              <Footer />
            </Box>
          </Providers>
        </ErrorBoundary>
        <SpeedInsights />
      </body>
    </html>
  );
}

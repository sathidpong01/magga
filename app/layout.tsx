import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/Providers";
import { Box, Container } from "@mui/material";
import Footer from "./components/Footer";
import Header from "./components/Header";

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

import AgeVerificationModal from "./components/AgeVerificationModal";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={kanit.className}>
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
      </body>
    </html>
  );
}

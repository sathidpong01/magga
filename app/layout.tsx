import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/Providers";
import AgeVerificationModal from "./components/AgeVerificationModal";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import ErrorBoundary from "./components/ErrorBoundary";
import LayoutWrapper from "./components/LayoutWrapper";

const kanit = Kanit({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin", "thai"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MAGGA - รวมการ์ตูนแนว Furry แปลไทย",
  description: "MAGGA - เว็บอ่านโดจินแปลไทย 18+ แนว Furry ที่ครบเครื่องที่สุด รวบรวมมังงะและโดจินชิ Furry สายหมี สายเคโมะ หลากหลายแนว แปลไทยคุณภาพ อ่านฟรีออนไลน์",
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
    <html lang="en" suppressHydrationWarning>
      <body className={kanit.className}>
        <ErrorBoundary>
          <Providers>
            <AgeVerificationModal />
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </Providers>
        </ErrorBoundary>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}

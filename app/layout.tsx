import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/layout/Providers";
import AgeVerificationModal from "./components/features/auth/AgeVerificationModal";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import ErrorBoundary from "./components/common/ErrorBoundary";
import LayoutWrapper from "./components/layout/LayoutWrapper";

const kanit = Kanit({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin", "thai"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://magga.vercel.app"),
  title: "MAGGA - รวมการ์ตูนแนว Furry แปลไทย",
  description: "MAGGA - เว็บอ่านโดจินแปลไทย 18+ แนว Furry ที่ครบเครื่องที่สุด รวบรวมมังงะและโดจินชิ Furry สายหมี สายเคโมะ หลากหลายแนว แปลไทยคุณภาพ อ่านฟรีออนไลน์",
  openGraph: {
    title: "MAGGA - รวมการ์ตูนแนว Furry แปลไทย",
    description: "เว็บอ่านการ์ตูนออนไลน์ อ่านฟรี อัปเดตใหม่ทุกวัน",
    url: "/",
    siteName: "MAGGA",
    images: [
      {
        url: "https://placehold.co/1200x630/png?text=MAGGA",
        width: 1200,
        height: 630,
        alt: "MAGGA",
      },
    ],
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MAGGA - รวมการ์ตูนแนว Furry แปลไทย",
    description: "เว็บอ่านการ์ตูนออนไลน์ อ่านฟรี อัปเดตใหม่ทุกวัน",
    images: ["https://placehold.co/1200x630/png?text=MAGGA"],
  },
  other: {
    rating: "mature",
    adult: "true",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
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

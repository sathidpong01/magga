import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/layout/Providers";
import AgeVerificationModal from "./components/features/auth/AgeVerificationModal";
import ErrorBoundary from "./components/common/ErrorBoundary";
import LayoutWrapper from "./components/layout/LayoutWrapper";
import LazyClientComponents from "./components/layout/LazyClientComponents";

const kanit = Kanit({
  weight: ["400", "500", "700"],
  subsets: ["latin", "thai"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://magga.vercel.app"),
  title: "MAGGA - รวมการ์ตูนแนว Furry แปลไทย",
  description:
    "MAGGA - เว็บอ่านโดจินแปลไทย 18+ แนว Furry ที่ครบเครื่องที่สุด รวบรวมมังงะและโดจินชิ Furry สายหมี สายเคโมะ หลากหลายแนว แปลไทยคุณภาพ อ่านฟรีออนไลน์",
  openGraph: {
    title: "MAGGA - รวมการ์ตูนแนว Furry แปลไทย",
    description: "เว็บอ่านการ์ตูนออนไลน์ อ่านฟรี อัปเดตใหม่ทุกวัน",
    url: "/",
    siteName: "MAGGA",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
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
    images: ["/android-chrome-512x512.png"],
  },
  other: {
    rating: "mature",
    adult: "true",
  },
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/favicon.png", type: "image/png" }],
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
    <html lang="th" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Preconnect to R2 CDN for faster image loading */}
        <link
          rel="preconnect"
          href="https://pub-1f8d25d164134702943300ef6d01fc35.r2.dev"
        />
        <link
          rel="dns-prefetch"
          href="https://pub-1f8d25d164134702943300ef6d01fc35.r2.dev"
        />
      </head>
      <body className={kanit.className}>
        <ErrorBoundary>
          <Providers>
            <AgeVerificationModal />
            <LazyClientComponents />
            <LayoutWrapper>{children}</LayoutWrapper>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}

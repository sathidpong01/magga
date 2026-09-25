import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/layout/Providers";
import ErrorBoundary from "./components/common/ErrorBoundary";
import LayoutWrapper from "./components/layout/LayoutWrapper";
import LazyClientComponents from "./components/layout/LazyClientComponents";
import { getSiteUrl } from "@/lib/site-url";
import { getStoragePublicUrl } from "@/lib/storage";

const kanit = Kanit({
  weight: ["400", "500", "700"],
  subsets: ["latin", "thai"],
  display: "swap",
});

const siteDescription =
  "อ่านการ์ตูน Furry แปลไทยบน MAGGA รวมมังงะ Furry และโดจินแปลไทยให้เลือกอ่านออนไลน์ ค้นหาเรื่องตามชื่อ ผู้แต่ง หมวดหมู่ หรือแท็ก";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "MAGGA - รวมการ์ตูนแนว Furry แปลไทย",
  description: siteDescription,
  openGraph: {
    title: "MAGGA - รวมการ์ตูนแนว Furry แปลไทย",
    description: siteDescription,
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
    description: siteDescription,
    images: ["/android-chrome-512x512.png"],
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
  const r2PublicUrl = getStoragePublicUrl("");

  return (
    <html lang="th" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <meta name="theme-color" content="#141416" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Preconnect to R2 CDN for faster image loading */}
        <link
          rel="preconnect"
          href={r2PublicUrl}
        />
        <link
          rel="dns-prefetch"
          href={r2PublicUrl}
        />
      </head>
      <body className={kanit.className}>
        <ErrorBoundary>
          <Providers>
            <LazyClientComponents />
            <LayoutWrapper>{children}</LayoutWrapper>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}

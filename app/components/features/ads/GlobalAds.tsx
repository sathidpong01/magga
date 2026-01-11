"use client";

import { usePathname } from "next/navigation";
import { AdContainer } from "@/app/components/features/ads";

export default function GlobalAds() {
  const pathname = usePathname();

  // ไม่แสดง ads บนหน้า dashboard
  const isDashboard = pathname.startsWith("/dashboard");

  // แสดงเฉพาะหน้าแรก (/) และหน้าอ่านมังงะ (/[mangaId])
  const isHomePage = pathname === "/";
  const isMangaPage = pathname.match(/^\/[^\/]+$/) && !isDashboard;

  // Don't show ads on dashboard pages
  if (isDashboard) {
    return null;
  }

  const shouldShowAds = isHomePage || isMangaPage;

  if (!shouldShowAds) {
    return null;
  }

  return (
    <>
      <AdContainer placement="floating" />
      <AdContainer placement="modal" />
    </>
  );
}

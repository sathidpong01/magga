"use client";

import { usePathname } from "next/navigation";
import { AdContainer } from "@/app/components/features/ads";

export default function GlobalAds() {
  const pathname = usePathname();

  // ไม่แสดง ads บนหน้า admin และ submit
  const isAdminOrSubmit = pathname.startsWith("/admin") || pathname.startsWith("/submit");
  
  // แสดงเฉพาะหน้าแรก (/) และหน้าอ่านมังงะ (/[mangaId])
  const isHomePage = pathname === "/";
  const isMangaPage = pathname.match(/^\/[^\/]+$/) && !isAdminOrSubmit;
  
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

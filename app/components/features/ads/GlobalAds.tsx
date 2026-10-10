"use client";

import { usePathname, useParams } from "next/navigation";
import { AdContainer } from "@/app/components/features/ads";

export default function GlobalAds() {
  const pathname = usePathname();
  const params = useParams();

  // ไม่แสดง ads บนหน้า dashboard
  const isDashboard = pathname.startsWith("/dashboard");

  // แสดงเฉพาะหน้าแรก (/) และหน้าอ่านมังงะ (/[mangaId])
  const isHomePage = pathname === "/";
  const isMangaPage = typeof params.mangaId === "string" && pathname.split("/").filter(Boolean).length === 1;

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

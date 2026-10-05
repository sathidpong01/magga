import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ตรวจรายละเอียดฝากลง - MAGGA",
  description: "ตรวจสอบรายละเอียดและภาพของผลงานที่ฝากลงบน MAGGA",
  openGraph: { title: "ตรวจรายละเอียดฝากลง - MAGGA", description: "ตรวจสอบรายละเอียดและภาพของผลงานที่ฝากลงบน MAGGA" },
  twitter: { title: "ตรวจรายละเอียดฝากลง - MAGGA", description: "ตรวจสอบรายละเอียดและภาพของผลงานที่ฝากลงบน MAGGA" },
};

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children;
}

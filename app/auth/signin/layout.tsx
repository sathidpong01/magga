import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ - MAGGA",
  description: "เข้าสู่ระบบ MAGGA เพื่อแสดงความคิดเห็นและฝากผลงานแปล",
  openGraph: { title: "เข้าสู่ระบบ - MAGGA", description: "เข้าสู่ระบบ MAGGA เพื่อแสดงความคิดเห็นและฝากผลงานแปล" },
  twitter: { title: "เข้าสู่ระบบ - MAGGA", description: "เข้าสู่ระบบ MAGGA เพื่อแสดงความคิดเห็นและฝากผลงานแปล" },
};

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children;
}

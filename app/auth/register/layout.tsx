import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "สมัครสมาชิก - MAGGA",
  description: "สมัครสมาชิก MAGGA เพื่อใช้งานโปรไฟล์ แสดงความคิดเห็น และฝากผลงานแปล",
  openGraph: { title: "สมัครสมาชิก - MAGGA", description: "สมัครสมาชิก MAGGA เพื่อใช้งานโปรไฟล์ แสดงความคิดเห็น และฝากผลงานแปล" },
  twitter: { title: "สมัครสมาชิก - MAGGA", description: "สมัครสมาชิก MAGGA เพื่อใช้งานโปรไฟล์ แสดงความคิดเห็น และฝากผลงานแปล" },
};

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children;
}

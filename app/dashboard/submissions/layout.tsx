import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "รายการฝากลงของฉัน - MAGGA",
  description: "ติดตามและจัดการรายการฝากลงของคุณบน MAGGA",
  openGraph: { title: "รายการฝากลงของฉัน - MAGGA", description: "ติดตามและจัดการรายการฝากลงของคุณบน MAGGA" },
  twitter: { title: "รายการฝากลงของฉัน - MAGGA", description: "ติดตามและจัดการรายการฝากลงของคุณบน MAGGA" },
};

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children;
}

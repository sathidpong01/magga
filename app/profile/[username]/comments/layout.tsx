import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ประวัติความคิดเห็น - MAGGA",
  description: "ดูประวัติความคิดเห็นบน MAGGA",
  openGraph: { title: "ประวัติความคิดเห็น - MAGGA", description: "ดูประวัติความคิดเห็นบน MAGGA" },
  twitter: { title: "ประวัติความคิดเห็น - MAGGA", description: "ดูประวัติความคิดเห็นบน MAGGA" },
};

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children;
}

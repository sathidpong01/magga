import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "จัดการโฆษณา - MAGGA",
  description: "จัดการโฆษณาบน MAGGA",
  openGraph: { title: "จัดการโฆษณา - MAGGA", description: "จัดการโฆษณาบน MAGGA" },
  twitter: { title: "จัดการโฆษณา - MAGGA", description: "จัดการโฆษณาบน MAGGA" },
};

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children;
}

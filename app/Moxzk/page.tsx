import type { Metadata } from "next";
import MoxzkLandingClient from "./MoxzkLandingClient";

export const metadata: Metadata = {
  title: "Moxzk - ดาวน์โหลดแอปแปลมังงะบน Windows",
  description:
    "ดาวน์โหลด Moxzk แอป Windows สำหรับคลีนภาพมังงะ แปลไทย จัดข้อความบนภาพ และส่งออกงานจากหน้าแก้ไขเดียว",
  openGraph: {
    title: "Moxzk - แอปแปลมังงะบน Windows",
    description:
      "คลีนภาพมังงะ แปลไทย และจัดข้อความกลับบนภาพ ในแอปเดสก์ท็อปเดียว",
    url: "/Moxzk",
    siteName: "MAGGA",
    images: [
      {
        url: "/moxzk-app.png",
        width: 1200,
        height: 675,
        alt: "Moxzk manga translation editor",
      },
    ],
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Moxzk - แอปแปลมังงะบน Windows",
    description:
      "ดาวน์โหลด Moxzk จาก GitHub Releases สำหรับคลีนภาพมังงะ แปลไทย และจัดข้อความบนภาพ",
    images: ["/moxzk-app.png"],
  },
};

export default function MoxzkPage() {
  return <MoxzkLandingClient />;
}

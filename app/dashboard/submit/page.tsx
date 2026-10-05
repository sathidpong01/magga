import type { Metadata } from "next";
import MangaForm from "@/app/components/forms/MangaForm";


export const metadata: Metadata = {
  title: "ฝากลงมังงะ - MAGGA",
  description: "ส่งผลงานแปลของคุณให้ผู้ดูแล MAGGA ตรวจสอบก่อนเผยแพร่",
  openGraph: { title: "ฝากลงมังงะ - MAGGA", description: "ส่งผลงานแปลของคุณให้ผู้ดูแล MAGGA ตรวจสอบก่อนเผยแพร่" },
  twitter: { title: "ฝากลงมังงะ - MAGGA", description: "ส่งผลงานแปลของคุณให้ผู้ดูแล MAGGA ตรวจสอบก่อนเผยแพร่" },
};

export default function SubmitPage() {
  return <MangaForm mode="submission" />;
}

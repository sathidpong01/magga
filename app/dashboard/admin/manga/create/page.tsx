import type { Metadata } from "next";
import MangaForm from "@/app/components/forms/MangaForm";


export const metadata: Metadata = {
  title: "สร้างมังงะ - MAGGA",
  description: "สร้างรายการมังงะบน MAGGA",
  openGraph: { title: "สร้างมังงะ - MAGGA", description: "สร้างรายการมังงะบน MAGGA" },
  twitter: { title: "สร้างมังงะ - MAGGA", description: "สร้างรายการมังงะบน MAGGA" },
};

export default function CreateMangaPage() {
  return <MangaForm mode="admin" />;
}

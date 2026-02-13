import MangaForm from "@/app/components/forms/MangaForm";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EditMangaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch manga
  const manga = await prisma.manga.findUnique({
    where: { id },
    include: {
      category: true,
      tags: true,
      author: true,
    },
  });

  if (!manga) {
    notFound();
  }

  return <MangaForm manga={manga} mode="admin" />;
}

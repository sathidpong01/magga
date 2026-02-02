import MangaForm from "@/app/components/forms/MangaForm";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EditMangaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch manga handling promises concurrently
  const [manga, categories, tags, authors] = await Promise.all([
    prisma.manga.findUnique({
      where: { id },
      include: {
        category: true,
        tags: true,
        author: true,
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.author.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!manga) {
    notFound();
  }

  return (
    <MangaForm
      manga={manga}
      mode="admin"
      initialCategories={categories}
      initialTags={tags}
      initialAuthors={authors}
    />
  );
}

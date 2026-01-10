import prisma from "@/lib/prisma";
import MangaForm from "../../MangaForm";
import { notFound } from "next/navigation";

type EditMangaPageProps = {
  params: Promise<{
    mangaId: string;
  }>;
};

// This is a server component that fetches the necessary data
// and passes it to the client component form.
export default async function EditMangaPage({ params }: EditMangaPageProps) {
  const { mangaId } = await params;
  
  const [manga, categories, tags, authors] = await Promise.all([
    prisma.manga.findUnique({
      where: { id: mangaId },
      include: { tags: true, author: true },
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' }
    }),
    prisma.tag.findMany({
      orderBy: { name: 'asc' }
    }),
    prisma.author.findMany({
      orderBy: { name: 'asc' }
    }),
  ]);

  if (!manga) {
    notFound();
  }

  return <MangaForm manga={manga} categories={categories} tags={tags} authors={authors} />;
}


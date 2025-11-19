import prisma from "@/lib/prisma";
import MangaForm from "../../MangaForm";
import { notFound } from "next/navigation";

type EditMangaPageProps = {
  params: {
    mangaId: string;
  };
};

// This is a server component that fetches the necessary data
// and passes it to the client component form.
export default async function EditMangaPage({ params }: EditMangaPageProps) {
  const mangaPromise = prisma.manga.findUnique({
    where: { id: params.mangaId },
    include: { tags: true },
  });

  const categoriesPromise = prisma.category.findMany({
    orderBy: { name: 'asc' }
  });

  const tagsPromise = prisma.tag.findMany({
    orderBy: { name: 'asc' }
  });

  const [manga, categories, tags] = await Promise.all([
    mangaPromise,
    categoriesPromise,
    tagsPromise,
  ]);

  if (!manga) {
    notFound();
  }

  return <MangaForm manga={manga} categories={categories} tags={tags} />;
}


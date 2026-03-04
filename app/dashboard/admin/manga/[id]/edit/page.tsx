import { db } from "@/db";
import { manga as mangaTable, mangaTags as mangaTagsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import MangaForm from "@/app/components/forms/MangaForm";

export default async function EditMangaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const mangaData = await db.query.manga.findFirst({
    where: eq(mangaTable.id, id),
    with: {
      category: true,
      author: true,
      mangaTags_mangaId: {
        with: { tag_tagId: true },
      },
    },
  });

  if (!mangaData) {
    notFound();
  }

  const manga = {
    ...mangaData,
    tags: mangaData.mangaTags_mangaId?.map((mt: any) => mt.tag_tagId) || [],
  };

  return <MangaForm manga={manga as any} mode="admin" />;
}

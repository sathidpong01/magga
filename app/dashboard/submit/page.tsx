import MangaForm from "@/app/components/forms/MangaForm";
import prisma from "@/lib/prisma";

export default async function SubmitPage() {
  const [categories, tags, authors] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.author.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <MangaForm
      mode="submission"
      initialCategories={categories}
      initialTags={tags}
      initialAuthors={authors}
    />
  );
}

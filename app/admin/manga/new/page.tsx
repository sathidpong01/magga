import prisma from '@/lib/prisma';
import MangaForm from '../MangaForm';

// This is a server component that fetches the necessary data
// and passes it to the client component form.
export default async function NewMangaPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });
  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <MangaForm categories={categories} tags={tags} />
  );
}

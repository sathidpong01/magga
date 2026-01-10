import prisma from '@/lib/prisma';
import MangaForm from '../MangaForm';

// This is a server component that fetches the necessary data
// and passes it to the client component form.
export default async function NewMangaPage() {
  const [categories, tags, authors] = await Promise.all([
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

  return (
    <MangaForm categories={categories} tags={tags} authors={authors} />
  );
}

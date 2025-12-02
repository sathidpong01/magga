import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const mangas = await prisma.manga.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
    },
    take: 5,
    orderBy: { updatedAt: 'desc' }
  });

  console.log("Mangas:", JSON.stringify(mangas, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

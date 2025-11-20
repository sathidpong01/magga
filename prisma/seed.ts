import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Cleanup existing data
  await prisma.manga.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.tag.deleteMany({});

  // Create a category
  const category = await prisma.category.create({
    data: {
      name: 'Slice of Life',
    },
  });

  // Create a tag
  const tag = await prisma.tag.create({
    data: {
      name: 'Comedy',
    },
  });

  // Create a manga
  await prisma.manga.create({
    data: {
      title: 'My First Manga',
      description: 'This is a short story about learning to code.',
      coverImage: 'https://via.placeholder.com/300x400.png?text=Cover',
      pages: JSON.stringify([
        'https://via.placeholder.com/800x1200.png?text=Page+1',
        'https://via.placeholder.com/800x1200.png?text=Page+2',
        'https://via.placeholder.com/800x1200.png?text=Page+3',
      ]),
      categoryId: category.id,
      tags: {
        connect: {
          id: tag.id,
        },
      },
    },
  });

  console.log('Database has been seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

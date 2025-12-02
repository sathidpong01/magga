import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const username = process.argv[2];

  if (!username) {
    console.error('Please provide a username.');
    process.exit(1);
  }

  try {
    const user = await prisma.user.update({
      where: { username },
      data: { role: 'ADMIN' },
    });
    console.log(`✅ User '${user.username}' has been successfully promoted to ADMIN.`);
  } catch (error) {
    console.error(`❌ Error updating user '${username}':`, error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

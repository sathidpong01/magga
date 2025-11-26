import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Validate required environment variables
if (!process.env.TURSO_DATABASE_URL) {
  throw new Error('Missing required environment variable: TURSO_DATABASE_URL');
}
if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error('Missing required environment variable: TURSO_AUTH_TOKEN');
}

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL.replace('libsql://', 'https://'),
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
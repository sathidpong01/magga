import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

// สร้าง global variable เพื่อป้องกันการสร้าง connection ซ้ำตอน dev (เหมือนเดิม)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// ตั้งค่า connection ไปที่ Turso
const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// สร้าง adapter
const adapter = new PrismaLibSQL(libsql);

// สร้าง Prisma Client ผ่าน adapter
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ['query'], // ถ้าอยากดู log query ก็เปิดไว้
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
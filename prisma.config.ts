import { defineConfig } from 'prisma/config';

// Load .env.local explicitly since Prisma CLI might not pick it up automatically
if (process.env.NODE_ENV !== 'production') {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    // ignore if file doesn't exist
  }
}

export default defineConfig({
  datasource: {
    url: process.env.TURSO_DATABASE_URL!,
  },
  // @ts-expect-error - seed is not yet in the type definition for Prisma 7
  seed: {
    command: 'tsx prisma/seed.ts',
  },
});

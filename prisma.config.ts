import { defineConfig } from 'prisma/config';

// Load .env.local explicitly since Prisma CLI might not pick it up automatically
if (process.env.NODE_ENV !== 'production') {
  try {
    process.loadEnvFile('.env.local');
    console.log('Loaded .env.local successfully');
  } catch {
    // ignore if file doesn't exist
  }
}

export default defineConfig({
  datasource: {
    url: process.env.TURSO_DATABASE_URL ?? '',
  },
});

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
    // For CLI commands (like migrate diff), we need a valid file URL because provider is sqlite.
    // The actual app uses the driver adapter in lib/prisma.ts with the Turso URL.
    url: 'file:./dev.db',
  },
});

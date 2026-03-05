import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schemaRaw from './schema';
import * as relations from './relations';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  throw new Error("Missing PostgreSQL connection string.");
}

// Disable prepare to support connection pooling like PgBouncer in Supabase
// Limit pool size to 1 during Next.js builds to prevent exhausting database connections
// (Next.js spawns up to 5 workers during build, each with their own connection pool)
// In Vercel serverless, each function instance must use max 1 connection to prevent
// MaxClientsInSessionMode pool exhaustion across concurrent invocations
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
const isServerless = !!process.env.VERCEL;
const client = postgres(connectionString, { 
  prepare: false, 
  max: isBuild || isServerless ? 1 : 10,
  idle_timeout: isBuild || isServerless ? 5 : 20,
  connect_timeout: 10,
});

const schema = { ...schemaRaw, ...relations };

export const db = drizzle(client, { schema });
export { schema };

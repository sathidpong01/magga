import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schemaRaw from './schema';
import * as relations from './relations';

const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
const isServerless = !!process.env.VERCEL;

const pooledConnectionString =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

const directConnectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

// On Vercel/Supabase runtime, prefer the pooled URL to avoid exhausting
// the session-mode client limit across concurrent lambdas.
const connectionString = isServerless
  ? pooledConnectionString || directConnectionString
  : directConnectionString || pooledConnectionString;

if (!connectionString) {
  throw new Error("Missing PostgreSQL connection string.");
}

// Disable prepare to support connection pooling like PgBouncer in Supabase
// Limit pool size to 1 during Next.js builds to prevent exhausting database connections
// (Next.js spawns up to 5 workers during build, each with their own connection pool)
// In Vercel serverless, each function instance must use max 1 connection even when
// using the pooled URL to keep pressure on the pooler low across concurrent invocations.
const client = postgres(connectionString, { 
  prepare: false, 
  max: isBuild || isServerless ? 1 : 10,
  idle_timeout: isBuild || isServerless ? 3 : 20,
  connect_timeout: 5,
  max_lifetime: isServerless ? 30 : null,
  connection: {
    application_name: isServerless ? "magga-vercel" : "magga-local",
    statement_timeout: isServerless ? 8000 : 15000,
    lock_timeout: 3000,
    idle_in_transaction_session_timeout: 5000,
  },
});

const schema = { ...schemaRaw, ...relations };

export const db = drizzle(client, { schema });
export { schema };

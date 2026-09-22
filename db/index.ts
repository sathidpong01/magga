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

const isLocalMcp = process.env.MCP_LOCAL_DATABASE === 'true';
if (isLocalMcp) {
  const target = new URL(connectionString);
  if (target.hostname !== '127.0.0.1' || target.port !== '55432' || target.pathname !== '/postgres') {
    throw new Error('Local MCP database mode requires the isolated loopback endpoint.');
  }
}

// Disable prepare to support connection pooling like PgBouncer in Supabase
// Limit pool size to 1 during Next.js builds to prevent exhausting database connections
// (Next.js spawns up to 5 workers during build, each with their own connection pool)
// In Vercel serverless, allow up to 3 connections per instance to handle parallel queries (Promise.all)
// without starving the pooler, while setting sensible timeouts for cold starts and lock contention.
const client = postgres(connectionString, { 
  prepare: false, 
  max: isBuild || isLocalMcp ? 1 : isServerless ? 3 : 10,
  idle_timeout: isBuild ? 1 : isServerless ? 15 : 20,
  connect_timeout: isServerless ? 15 : 10,
  max_lifetime: isServerless ? 120 : null,
  connection: {
    application_name: isServerless ? "magga-vercel" : "magga-local",
    statement_timeout: isServerless ? 15000 : 20000,
    lock_timeout: 10000,
    idle_in_transaction_session_timeout: 10000,
  },
});

const schema = { ...schemaRaw, ...relations };

export const db = drizzle(client, { schema });
export { schema };

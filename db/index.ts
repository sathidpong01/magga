import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schemaRaw from './schema';
import * as relations from './relations';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  throw new Error("Missing PostgreSQL connection string.");
}

// Disable prepare to support connection pooling like PgBouncer in Supabase
const client = postgres(connectionString, { prepare: false });

const schema = { ...schemaRaw, ...relations };

export const db = drizzle(client, { schema });
export { schema };

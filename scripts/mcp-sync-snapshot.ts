// Update only the MCP table entries after the reviewed custom migration.
// This is an offline metadata operation; it never opens a database connection.
import { generateDrizzleJson } from 'drizzle-kit/api';
import { readFileSync, writeFileSync } from 'node:fs';
import * as schema from '../db/mcp-schema';

const path = 'db/migrations/meta/0008_snapshot.json';
const snapshot = JSON.parse(readFileSync(path, 'utf8'));
const generated = generateDrizzleJson(schema);
for (const [name, table] of Object.entries(generated.tables)) {
  if (name.startsWith('public.mcp_')) snapshot.tables[name] = table;
}
writeFileSync(path, JSON.stringify(snapshot, null, 2) + '\n');

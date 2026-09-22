import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { db } from '@/db';
import { createCatalog } from '@/lib/mcp/metadata-service';
import { createDependencies } from '@/lib/mcp/dependencies';

describe('MCP database isolation', () => {
  const pg = new PGlite();
  const visible = '00000000-0000-4000-8000-000000000001';
  const hidden = '00000000-0000-4000-8000-000000000002';
  const key = '00000000-0000-4000-8000-000000000003';
  const catalog = createCatalog(drizzle(pg) as unknown as typeof db);
  const deps = createDependencies(drizzle(pg) as unknown as typeof db);
  beforeAll(async () => {
    await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated;
      CREATE TABLE profiles (id text PRIMARY KEY);
      INSERT INTO profiles VALUES ('owner');
      CREATE TABLE authors (id uuid PRIMARY KEY, name text);
      CREATE TABLE categories (id uuid PRIMARY KEY, name text);
      CREATE TABLE tags (id uuid PRIMARY KEY, name text);
      CREATE TABLE manga (id uuid PRIMARY KEY, title text, slug text, author_id uuid, category_id uuid, is_hidden boolean);
      CREATE TABLE manga_tags (manga_id uuid, tag_id uuid);
      INSERT INTO manga VALUES ('${visible}', 'Public book', 'public', NULL, NULL, false), ('${hidden}', 'Hidden book', 'hidden', NULL, NULL, true);`);
    await pg.exec(readFileSync('db/migrations/0008_mcp_access_and_drafts.sql', 'utf8'));
    await pg.exec(readFileSync('db/migrations/0010_mcp_partial_approval.sql', 'utf8'));
    await pg.query('INSERT INTO mcp_api_keys (id, owner_user_id, name, key_prefix, secret_hash, scopes, expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7)', [key, 'owner', 'test', 'mgm_test', 'a'.repeat(64), ['catalog:read'], '2099-01-01']);
  }, 30000);
  afterAll(async () => { await pg.close(); });
  it('filters hidden manga from search, details and tagging context', async () => {
    expect(await catalog.findManga('book')).toEqual([expect.objectContaining({ id: visible })]);
    expect(await catalog.mangaDetails(hidden)).toBeNull(); expect(await catalog.taggingContext(hidden)).toBeNull();
    expect(await catalog.mangaDetails(visible)).toEqual(expect.objectContaining({ id: visible, tags: [] }));
  });
  it('treats wildcard input literally', async () => { expect(await catalog.findManga('%')).toEqual([]); });
  it('enforces an atomic shared 60-request window, reset and revocation', async () => {
    const accepted = await Promise.all(Array.from({ length: 65 }, () => deps.consume(key)));
    expect(accepted.filter(Boolean)).toHaveLength(60);
    await pg.query("UPDATE mcp_api_keys SET window_start = now() - interval '2 minutes' WHERE id = $1", [key]);
    expect(await deps.consume(key)).toBe(true);
    await pg.query('UPDATE mcp_api_keys SET revoked_at = now() WHERE id = $1', [key]);
    expect(await deps.consume(key)).toBe(false);
  });
  it('denies browser roles access to all MCP tables', async () => {
    for (const role of ['anon', 'authenticated']) {
      await pg.exec(`SET ROLE ${role}`);
      try {
        for (const table of ['mcp_api_keys', 'mcp_metadata_drafts', 'mcp_audit_events']) {
          await expect(pg.query(`SELECT * FROM ${table}`)).rejects.toThrow(/permission denied/);
        }
      } finally { await pg.exec('RESET ROLE'); }
    }
  });
  it('audit accepts inserts but rejects updates, deletes and truncate', async () => {
    await pg.query('INSERT INTO mcp_audit_events (request_id, key_id, owner_user_id, tool_name, outcome) VALUES ($1,$2,$3,$4,$5)', [visible, key, 'owner', 'find_manga', 'success']);
    for (const statement of ["UPDATE mcp_audit_events SET outcome = 'failed'", 'DELETE FROM mcp_audit_events', 'TRUNCATE mcp_audit_events']) {
      await expect(pg.exec(statement)).rejects.toThrow('append-only');
    }
    expect((await pg.query('SELECT * FROM mcp_audit_events')).rows).toHaveLength(1);
  });
});

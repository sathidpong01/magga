import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { db } from '@/db';
import { createDraftService, draftInput, publicReference, type DraftInput } from '@/lib/mcp/drafts';

describe('pending MCP drafts', () => {
  const pg = new PGlite();
  const target = randomUUID(); const hidden = randomUUID(); const author = randomUUID(); const tag = randomUUID(); const category = randomUUID();
  const key = { id: randomUUID(), ownerUserId: 'owner', name: 'test', scopes: ['catalog:read', 'draft:write'] };
  const service = createDraftService(drizzle(pg) as unknown as typeof db, ['example.com']);
  const input = (): Extract<DraftInput, { kind: 'manga_tags' }> => ({ request_id: randomUUID(), kind: 'manga_tags', target: { type: 'manga', id: target }, proposal: { tag_names: ['Adventure'] }, sources: [] });
  beforeAll(async () => {
    await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated;
      CREATE TABLE profiles (id text PRIMARY KEY, role text DEFAULT 'admin', is_banned boolean DEFAULT false, banned boolean DEFAULT false); INSERT INTO profiles (id) VALUES ('owner');
      CREATE TABLE manga (id uuid PRIMARY KEY, title text, is_hidden boolean, category_id uuid);
      CREATE TABLE authors (id uuid PRIMARY KEY, name text);
      CREATE TABLE categories (id uuid PRIMARY KEY, name text UNIQUE);
      CREATE TABLE tags (id uuid PRIMARY KEY, name text);
      CREATE TABLE manga_tags (manga_id uuid, tag_id uuid);
      INSERT INTO manga(id,title,is_hidden) VALUES ('${target}','Original',false), ('${hidden}','Hidden',true);
      INSERT INTO authors VALUES ('${author}','Original author'); INSERT INTO categories VALUES ('${category}','MM');
      INSERT INTO tags VALUES ('${tag}','Adventure'); INSERT INTO manga_tags VALUES ('${target}','${tag}');`);
    await pg.exec(readFileSync('db/migrations/0008_mcp_access_and_drafts.sql', 'utf8'));
    await pg.exec(readFileSync('db/migrations/0010_mcp_partial_approval.sql', 'utf8'));
    await pg.query('INSERT INTO mcp_api_keys (id,owner_user_id,name,key_prefix,secret_hash,scopes,expires_at) VALUES ($1,$2,$3,$4,$5,$6,$7)', [key.id, 'owner','test','prefix','a'.repeat(64),key.scopes,'2099-01-01']);
  }, 30000);
  afterAll(async () => { await pg.close(); });
  it('classifies existing and new tag names without writing', async () => {
    expect(await service.validateTags(target, ['Adventure', 'adventure', 'Invented'])).toEqual({ valid: true, tags: [{ id: tag, name: 'Adventure' }], unknown_tags: ['Invented'], existing_tags: [{ id: tag, name: 'Adventure' }], new_tags: ['Invented'] });
    expect((await pg.query('SELECT * FROM mcp_metadata_drafts')).rows).toHaveLength(0);
  });
  it('classifies an existing or new category without writing', async () => {
    expect(await service.validateCategory(target, 'mm')).toMatchObject({ valid: true, existing_category: { id: category, name: 'MM' }, new_category: null });
    expect(await service.validateCategory(target, 'New category')).toMatchObject({ valid: true, existing_category: null, new_category: 'New category' });
    expect((await pg.query('SELECT * FROM categories')).rows).toHaveLength(1);
  });
  it('creates pending drafts with atomic audit and idempotent retry', async () => {
    const proposal = input();
    const before = (await pg.query('SELECT * FROM manga_tags')).rows;
    const first = await service.create(proposal, key, randomUUID());
    expect(await service.create(proposal, key, randomUUID())).toEqual(first);
    expect(first).toEqual({ draft_id: proposal.request_id, status: 'pending', applied: false });
    expect((await pg.query('SELECT * FROM mcp_metadata_drafts WHERE id=$1',[proposal.request_id])).rows).toHaveLength(1);
    expect((await pg.query('SELECT * FROM manga_tags')).rows).toEqual(before);
    expect((await pg.query('SELECT title FROM manga WHERE id=$1',[target])).rows).toEqual([{ title: 'Original' }]);
    expect((await pg.query('SELECT * FROM mcp_audit_events')).rows).toHaveLength(2);
  });
  it('accepts new tags in pending drafts but rejects hidden and nonexistent targets', async () => {
    for (const id of [hidden, randomUUID()]) {
      await expect(service.validateTags(id, ['Adventure'])).rejects.toThrow();
      await expect(service.create({ ...input(), target: { type: 'manga', id } }, key, randomUUID())).rejects.toThrow();
    }
    const proposal = { ...input(), proposal: { tag_names: ['Invented', 'invented'] } };
    await expect(service.create(proposal, key, randomUUID())).resolves.toMatchObject({ status: 'pending', applied: false });
    expect((await pg.query<{payload:{tag_names:string[]}}>('SELECT payload FROM mcp_metadata_drafts WHERE id=$1',[proposal.request_id])).rows[0].payload.tag_names).toEqual(['Invented']);
  });
  it('does not grant draft permission through metadata:write', async () => {
    await expect(service.create(input(), { ...key, scopes: ['catalog:read','metadata:write'] }, randomUUID())).rejects.toThrow('Access denied');
  });
  it('rechecks stored revocation and scopes before committing', async () => {
    await pg.query('UPDATE mcp_api_keys SET revoked_at=now() WHERE id=$1',[key.id]);
    await expect(service.create(input(), key, randomUUID())).rejects.toThrow('Access denied');
    await pg.query("UPDATE mcp_api_keys SET revoked_at=NULL, scopes=ARRAY['catalog:read'] WHERE id=$1",[key.id]);
    await expect(service.create(input(), key, randomUUID())).rejects.toThrow('Access denied');
    await pg.query('UPDATE mcp_api_keys SET scopes=$2 WHERE id=$1',[key.id,key.scopes]);
  });
  it('rejects conflicting idempotency payload and key ownership', async () => {
    const proposal = input(); await service.create(proposal, key, randomUUID());
    await expect(service.create({ ...proposal, sources: [{ url: 'https://example.com/source', confidence: 0.3 }] }, key, randomUUID())).rejects.toThrow('Request conflict');
    await expect(service.create(proposal, { ...key, id: randomUUID() }, randomUUID())).rejects.toThrow();
  });
  it('rolls back draft insertion when its audit insert fails', async () => {
    const proposal = input();
    await pg.exec("CREATE FUNCTION reject_test_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'audit offline'; END; $$; CREATE TRIGGER fail_test_audit BEFORE INSERT ON mcp_audit_events FOR EACH ROW EXECUTE FUNCTION reject_test_audit();");
    try { await expect(service.create(proposal, key, randomUUID())).rejects.toThrow(); }
    finally { await pg.exec('DROP TRIGGER fail_test_audit ON mcp_audit_events; DROP FUNCTION reject_test_audit();'); }
    expect((await pg.query('SELECT * FROM mcp_metadata_drafts WHERE id=$1',[proposal.request_id])).rows).toHaveLength(0);
  });
  it('stores sourced metadata as unverified and leaves the original unchanged', async () => {
    const proposal: DraftInput = { request_id: randomUUID(), kind: 'manga_metadata', target: { type: 'manga', id: target }, proposal: { title: 'Proposed' }, sources: [{ url: 'https://example.com/source', confidence: 1 }] };
    await service.create(proposal, key, randomUUID());
    const { rows } = await pg.query<{ sources: unknown }>('SELECT sources FROM mcp_metadata_drafts WHERE id=$1',[proposal.request_id]);
    expect(rows[0].sources).toEqual([{ url: 'https://example.com/source', confidence: 1, verification: 'unverified', confidenceOrigin: 'client' }]);
    expect((await pg.query('SELECT title FROM manga WHERE id=$1',[target])).rows).toEqual([{ title: 'Original' }]);
  });
  it('allows a category-only draft without sources but keeps sources mandatory for mixed metadata', async () => {
    const categoryOnly: DraftInput = { request_id: randomUUID(), kind: 'manga_metadata', target: { type: 'manga', id: target }, proposal: { category_name: 'New category' }, sources: [] };
    await expect(service.create(categoryOnly, key, randomUUID())).resolves.toMatchObject({ status: 'pending', applied: false });
    await expect(service.create({ ...categoryOnly, request_id: randomUUID(), proposal: { category_name: 'New category', title: 'Changed' } }, key, randomUUID())).rejects.toThrow('Sources required');
  });
  it('accepts a sourced author-link draft without changing the author', async () => {
    await service.create({ request_id: randomUUID(), kind: 'author_links', target: { type: 'author', id: author }, proposal: { profile_url: 'https://example.com/artist' }, sources: [{ url: 'https://example.com/source', confidence: 0.5 }] }, key, randomUUID());
    expect((await pg.query('SELECT * FROM authors')).rows).toEqual([{ id: author, name: 'Original author' }]);
  });
  it('rejects approval flags, arbitrary fields, empty proposals and mismatched target kinds', () => {
    expect(draftInput.safeParse({ ...input(), status: 'approved' }).success).toBe(false);
    expect(draftInput.safeParse({ ...input(), proposal: { tag_names: ['Adventure'], sql: 'DELETE' } }).success).toBe(false);
    expect(draftInput.safeParse({ ...input(), kind: 'manga_metadata', proposal: {} }).success).toBe(false);
    expect(draftInput.safeParse({ ...input(), kind: 'manga_metadata', proposal: { category_id: category, category_name: 'MM' } }).success).toBe(false);
    expect(draftInput.safeParse({ ...input(), target: { type: 'author', id: author } }).success).toBe(false);
  });
});
describe('public source references (no fetching)', () => {
  it.each(['http://example.com/a', 'https://user:pass@example.com/a', 'https://example.com/?token=secret', 'https://example.com/#private', 'https://example.com:8443/a', 'https://127.0.0.1/a', 'https://[::1]/a', 'https://sub.example.com/a', 'https://example.com.evil.org/a', 'https://localhost/a'])('rejects %s', (url) => {
    expect(() => publicReference(url, ['example.com'])).toThrow();
  });
  it('denies URLs with an explicitly empty host allowlist', () => { expect(() => publicReference('https://example.com/a', [])).toThrow(); });
  it('accepts client sources without selecting a provider or host list', () => { expect(publicReference('https://publisher.example.org/a')).toBe('https://publisher.example.org/a'); });
  it.each(['https://localhost./a', 'https://device.home.arpa/a'])('rejects local DNS spelling without a host list: %s', (url) => { expect(() => publicReference(url)).toThrow(); });
});

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const pg = new PGlite();
const guestId = '12345678-1234-4234-8234-123456789abc';
const parentId = '12345678-1234-4234-8234-123456789abd';
beforeAll(async () => {
  await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated;
    CREATE TABLE public.profiles (id text PRIMARY KEY);
    INSERT INTO public.profiles VALUES ('member');
    CREATE TABLE public.comments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), content text NOT NULL, user_id text NOT NULL REFERENCES profiles(id), parent_id uuid CONSTRAINT comments_parent_id_fkey REFERENCES comments(id) ON DELETE CASCADE, created_at timestamptz DEFAULT now());
    CREATE TABLE public.comment_votes (id uuid);
    GRANT ALL ON comments, comment_votes TO anon, authenticated;
    INSERT INTO comments (id,content,user_id) VALUES ('${parentId}','Original member comment','member');`);
  await pg.exec(readFileSync('db/migrations/0013_guest_comments.sql', 'utf8'));
  await pg.exec(`INSERT INTO private.comment_guests (id,public_code,name) VALUES ('${guestId}','7K4M','Guest');`);
}, 30000);
afterAll(async () => pg.close());

describe('additive guest comment migration', () => {
  it('preserves existing member rows and publishes them by default', async () => {
    const { rows } = await pg.query<{ content: string; status: string; user_id: string }>(`SELECT content,status,user_id FROM comments WHERE id='${parentId}'`);
    expect(rows).toEqual([{ content: 'Original member comment', status: 'published', user_id: 'member' }]);
  });
  it('enforces exactly one owner and does not allow duplicate requests for an owner', async () => {
    await expect(pg.exec(`INSERT INTO comments(content) VALUES ('no owner')`)).rejects.toThrow();
    await expect(pg.exec(`INSERT INTO comments(content,user_id,guest_id) VALUES ('two owners','member','${guestId}')`)).rejects.toThrow();
    await pg.exec(`INSERT INTO comments(content,guest_id,idempotency_key) VALUES ('guest','${guestId}','request-1')`);
    await expect(pg.exec(`INSERT INTO comments(content,guest_id,idempotency_key) VALUES ('duplicate','${guestId}','request-1')`)).rejects.toThrow();
    await pg.exec(`INSERT INTO comments(content,user_id,idempotency_key) VALUES ('different owner','member','request-1')`);
  });
  it('rejects physical parent deletion and keeps replies during soft removal', async () => {
    await pg.exec(`INSERT INTO comments(content,guest_id,parent_id) VALUES ('reply','${guestId}','${parentId}')`);
    await expect(pg.exec(`DELETE FROM comments WHERE id='${parentId}'`)).rejects.toThrow();
    await pg.exec(`UPDATE comments SET status='deleted' WHERE id='${parentId}'`);
    const { rows } = await pg.query(`SELECT id FROM comments WHERE parent_id='${parentId}'`);
    expect(rows).toHaveLength(1);
  });
  it('session expiry cleanup leaves guest comments intact', async () => {
    await pg.exec(`INSERT INTO private.comment_guest_sessions(guest_id,token_hash,expires_at) VALUES ('${guestId}', repeat('a',64),now()); DELETE FROM private.comment_guest_sessions WHERE guest_id='${guestId}'`);
    const { rows } = await pg.query(`SELECT id FROM comments WHERE guest_id='${guestId}'`);
    expect(rows.length).toBeGreaterThan(0);
    await expect(pg.exec(`DELETE FROM private.comment_guests WHERE id='${guestId}'`)).rejects.toThrow();
  });
  it('blocks Data API read, write and truncate privileges including session hashes', async () => {
    const { rows } = await pg.query<{ allowed: boolean }>(`SELECT has_table_privilege('anon','public.comments','SELECT') OR has_table_privilege('authenticated','public.comments','TRUNCATE') OR has_table_privilege('anon','private.comment_guest_sessions','SELECT') AS allowed`);
    expect(rows[0].allowed).toBe(false);
  });
  it('enforces asset ownership and report deduplication', async () => {
    await expect(pg.exec(`INSERT INTO private.comment_assets(object_key,content_type,bytes,width,height,expires_at) VALUES ('asset','image/webp',50,10,10,now())`)).rejects.toThrow();
    await pg.exec(`INSERT INTO private.comment_reports(comment_id,guest_id,reason) VALUES ('${parentId}','${guestId}','spam')`);
    await expect(pg.exec(`INSERT INTO private.comment_reports(comment_id,guest_id,reason) VALUES ('${parentId}','${guestId}','abuse')`)).rejects.toThrow();
  });
});

import { afterAll, beforeAll, beforeEach, describe, expect, it, jest, mock } from 'bun:test';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
const imageProcessing = await import('@/lib/comments/image-processing');
import type { CommentActor } from '@/lib/comments/identity';
const state = { database: null as unknown, get: jest.fn(), put: jest.fn(), remove: jest.fn(), actor: jest.fn(), guest: jest.fn(), publish: jest.fn(), preview: jest.fn(),publicUrl:jest.fn(),unpublish:jest.fn(),discard:jest.fn() };
const schema = await import('@/db/schema');
const pg = new PGlite();
const database = drizzle(pg, { schema });
state.database = database;
mock.module('@/db', () => ({ get db() { return state.database; } }));
mock.module('@/lib/comments/identity', () => ({ resolveCommentActor: state.actor, resolveGuestActor: state.guest }));
mock.module('@/lib/storage/comment-private', () => ({ getCommentPrivateStorage: () => ({ get: state.get, put: state.put, delete: state.remove, publish: state.publish, previewUrl: state.preview,publicUrl:state.publicUrl,unpublish:state.unpublish,discardStaging:state.discard }) }));
const { createCommentAsset, reserveCommentAsset, finalizeCommentAsset, readPublishedCommentAsset, cleanupCommentAssets, retireCommentAssets, decorateCommentImagePreviews, rollbackCommentAssetPublication, discardPublishedCommentStaging } = await import('@/lib/comments/assets');

const { ForbiddenCommentError, NotFoundCommentError } = await import('@/lib/comments/types');


const guest = '11111111-1111-4111-8111-111111111111';
const assetId = '22222222-2222-4222-8222-222222222222';
const commentId = '33333333-3333-4333-8333-333333333333';
const mangaId = '44444444-4444-4444-8444-444444444444';
const parentId = '55555555-5555-4555-8555-555555555555';
const actor: CommentActor = { kind: 'guest', guestId: guest, sessionId: guest, name: 'Guest', publicCode: 'AA11', verifiedUntil: null };

beforeAll(async () => {
  await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated;
    CREATE TABLE profiles(id text PRIMARY KEY);
    CREATE TABLE manga(id uuid PRIMARY KEY,is_hidden boolean DEFAULT false);
    CREATE TABLE comments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),content text NOT NULL,user_id text NOT NULL REFERENCES profiles(id),parent_id uuid CONSTRAINT comments_parent_id_fkey REFERENCES comments(id) ON DELETE CASCADE,manga_id uuid REFERENCES manga(id),image_url text,image_index integer,vote_score integer DEFAULT 0,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
    CREATE TABLE comment_votes(id uuid);`);
  await pg.exec(readFileSync('db/migrations/0013_guest_comments.sql', 'utf8'));
  await pg.exec(`INSERT INTO private.comment_guests(id,public_code,name) VALUES ('${guest}','AA11','Guest'); INSERT INTO manga(id) VALUES ('${mangaId}');
    INSERT INTO comments(id,content,guest_id,manga_id) VALUES ('${parentId}','parent','${guest}','${mangaId}'),('${commentId}','image','${guest}','${mangaId}');`);
}, 30000);
afterAll(async () => pg.close());
beforeEach(async () => {
  jest.clearAllMocks(); state.actor.mockResolvedValue(null); state.guest.mockResolvedValue(null); state.get.mockResolvedValue(new Uint8Array([1, 2, 3])); state.remove.mockResolvedValue(undefined); state.discard.mockResolvedValue(undefined); state.put.mockResolvedValue(undefined); state.publish.mockResolvedValue("https://comments.test/comments/test.webp"); state.preview.mockResolvedValue("https://private.test/signed"); state.publicUrl.mockReturnValue("https://comments.test/comments/test.webp");
  await pg.exec(`DELETE FROM private.comment_assets; INSERT INTO comments(id,content,guest_id,manga_id) VALUES ('${commentId}','image','${guest}','${mangaId}') ON CONFLICT DO NOTHING; UPDATE comments SET status='published',parent_id=NULL; UPDATE manga SET is_hidden=false;
    INSERT INTO private.comment_assets(id,guest_id,object_key,content_type,bytes,width,height,state,expires_at,comment_id) VALUES ('${assetId}','${guest}','comments/test.webp','image/webp',100,10,10,'staged',now()+interval '1 hour',NULL);`);
});

describe('comment assets with real Postgres ownership and visibility queries', () => {
  it('enforces the three-file staged quota across simultaneous upload requests', async () => {
    const image = await sharp({ create: { width: 10, height: 10, channels: 3, background: 'red' } }).png().toBuffer();
    const upload = () => createCommentAsset(actor, new File([new Uint8Array(image)], 'test.png', { type: 'image/png' }));
    const results = await Promise.allSettled([upload(), upload(), upload()]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(2);
    expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
    expect(state.put).toHaveBeenCalledTimes(2);
    expect((await pg.query(`SELECT id FROM private.comment_assets WHERE state IN ('staged','reserved')`)).rows).toHaveLength(3);
  });
  it('rejects an upload removed during decoding before writing any orphan object',async()=>{
    let beginDecode!:()=>void, finishDecode!:()=>void;
    const decoding=new Promise<void>(resolve=>{beginDecode=resolve;});
    const continueDecode=new Promise<void>(resolve=>{finishDecode=resolve;});
    const spy=jest.spyOn(imageProcessing,'processCommentImage').mockImplementationOnce(async()=>{
      beginDecode();await continueDecode;
      return {data:Buffer.from([1,2,3]),contentType:'image/webp',bytes:3,width:10,height:10};
    });
    try {
      const upload=createCommentAsset(actor,new File(['image'],'test.png',{type:'image/png'}));
      await decoding;
      await pg.exec(`DELETE FROM private.comment_assets WHERE state='reserved'`);
      finishDecode();
      await expect(upload).rejects.toMatchObject({status:400});
      expect(state.put).not.toHaveBeenCalled();
      expect((await pg.query(`SELECT id FROM private.comment_assets WHERE state='reserved'`)).rows).toHaveLength(0);
    } finally {finishDecode();spy.mockRestore();}
  });
  it('tracks failed uploads for cleanup and attempts deletion only for the generated private key', async () => {
    const image = await sharp({ create: { width: 10, height: 10, channels: 3, background: 'red' } }).png().toBuffer();
    state.put.mockRejectedValueOnce(new Error('upload failed'));
    await expect(createCommentAsset(actor, new File([new Uint8Array(image)], 'test.png', { type: 'image/png' }))).rejects.toThrow('upload failed');
    const failed = (await pg.query<{ object_key: string }>(`SELECT object_key FROM private.comment_assets WHERE state='deleted'`)).rows;
    expect(failed).toHaveLength(1);
    expect(failed[0].object_key).toMatch(/^comments\/[a-f0-9-]+\.webp$/);
    expect(state.remove).toHaveBeenCalledWith(failed[0].object_key);
  });
  it('rejects another owner, expired files, and reused published assets', async () => {
    const other = { ...actor, guestId: '66666666-6666-4666-8666-666666666666' };
    await expect(database.transaction(tx => reserveCommentAsset(tx as never, other, assetId, commentId))).rejects.toThrow();
    await pg.exec(`UPDATE private.comment_assets SET expires_at=now()-interval '1 second'`);
    await expect(database.transaction(tx => reserveCommentAsset(tx as never, actor, assetId, commentId))).rejects.toThrow();
    await pg.exec(`UPDATE private.comment_assets SET expires_at=now()+interval '1 hour',state='published',comment_id='${commentId}'`);
    await expect(database.transaction(tx => reserveCommentAsset(tx as never, actor, assetId, commentId))).rejects.toThrow();
  });
  it('commits a single reservation and rolls back reservation when comment creation fails', async () => {
    await expect(database.transaction(async tx => { await reserveCommentAsset(tx as never, actor, assetId, commentId); throw new Error('insert failed'); })).rejects.toThrow('insert failed');
    const first = await pg.query<{ state: string }>(`SELECT state FROM private.comment_assets WHERE id='${assetId}'`);
    expect(first.rows[0].state).toBe('staged');
    await database.transaction(async tx => { await reserveCommentAsset(tx as never, actor, assetId, commentId); await finalizeCommentAsset(tx as never, assetId, commentId); });
    await expect(database.transaction(tx => reserveCommentAsset(tx as never, actor, assetId, commentId))).rejects.toThrow();
    const final = await pg.query<{ state: string; comment_id: string }>(`SELECT state,comment_id FROM private.comment_assets WHERE id='${assetId}'`);
    expect(final.rows[0]).toEqual({ state: 'published', comment_id: commentId });
  });
  it('allows only one of two simultaneous attachments to consume the same asset', async () => {
    const attach = () => database.transaction(async tx => {
      await reserveCommentAsset(tx as never, actor, assetId, commentId);
      await finalizeCommentAsset(tx as never, assetId, commentId);
    });
    const results = await Promise.allSettled([attach(), attach()]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
  });
  it('never calls storage for unlinked, staged, pending, hidden, deleted or hidden manga images', async () => {
    await expect(readPublishedCommentAsset(assetId)).rejects.toThrow();
    await pg.exec(`UPDATE private.comment_assets SET state='published',comment_id='${commentId}'`);
    for (const status of ['pending', 'hidden', 'deleted']) {
      await pg.exec(`UPDATE comments SET status='${status}' WHERE id='${commentId}'`);
      await expect(readPublishedCommentAsset(assetId)).rejects.toThrow();
    }
    await pg.exec(`UPDATE comments SET status='published'; UPDATE manga SET is_hidden=true`);
    await expect(readPublishedCommentAsset(assetId)).rejects.toThrow();
    expect(state.get).not.toHaveBeenCalled();
  });
  it('blocks hidden/pending parent images but preserves image access under deleted placeholders', async () => {
    await pg.exec(`UPDATE private.comment_assets SET state='published',comment_id='${commentId}'; UPDATE comments SET parent_id='${parentId}' WHERE id='${commentId}'`);
    for (const status of ['hidden', 'pending']) {
      await pg.exec(`UPDATE comments SET status='${status}' WHERE id='${parentId}'`);
      await expect(readPublishedCommentAsset(assetId)).rejects.toThrow();
    }
    expect(state.get).not.toHaveBeenCalled();
    await pg.exec(`UPDATE comments SET status='deleted' WHERE id='${parentId}'`);
    await expect(readPublishedCommentAsset(assetId)).resolves.toEqual("https://comments.test/comments/test.webp");
    expect(state.get).not.toHaveBeenCalled();
    expect(state.publicUrl).toHaveBeenCalledWith('comments/test.webp');
  });
  it('deletes only expired unlinked assets and keeps metadata for failed object removal retries', async () => {
    await pg.exec(`UPDATE private.comment_assets SET expires_at=now()-interval '1 second'`);
    state.remove.mockRejectedValueOnce(new Error('storage unavailable'));
    await expect(cleanupCommentAssets()).rejects.toThrow('storage unavailable');
    expect((await pg.query(`SELECT id FROM private.comment_assets`)).rows).toHaveLength(1);
    await expect(cleanupCommentAssets()).resolves.toEqual({ deleted: 1 });
    expect((await pg.query(`SELECT id FROM private.comment_assets`)).rows).toHaveLength(0);
    expect(state.remove).toHaveBeenCalledWith('comments/test.webp');
  });
  it('never purges published assets or expired records already linked to comments', async () => {
    await pg.exec(`UPDATE private.comment_assets SET expires_at=now()-interval '1 second',comment_id='${commentId}',state='reserved'`);
    await cleanupCommentAssets(); expect(state.remove).not.toHaveBeenCalled();
    await pg.exec(`UPDATE private.comment_assets SET state='published'`);
    await cleanupCommentAssets(); expect(state.remove).not.toHaveBeenCalled();
    expect((await pg.query(`SELECT id FROM private.comment_assets`)).rows).toHaveLength(1);
  });
  it('purges expired published objects orphaned by physical comment or manga removal', async () => {
    await pg.exec(`UPDATE private.comment_assets SET state='published',comment_id='${commentId}',expires_at=now()-interval '1 second'; DELETE FROM comments WHERE id='${commentId}'`);
    await expect(cleanupCommentAssets()).resolves.toEqual({ deleted: 1 });
    expect(state.remove).toHaveBeenCalledWith('comments/test.webp');
    expect((await pg.query(`SELECT id FROM private.comment_assets`)).rows).toHaveLength(0);
    await pg.exec(`INSERT INTO comments(id,content,guest_id,manga_id) VALUES ('${commentId}','image','${guest}','${mangaId}')`);
  });
  it('permits only the pending owner or current admin to preview nonpublic images', async () => {
    await pg.exec(`UPDATE private.comment_assets SET state='published',comment_id='${commentId}'; UPDATE comments SET status='pending' WHERE id='${commentId}'`);
    state.actor.mockResolvedValue(actor);
    await expect(readPublishedCommentAsset(assetId)).resolves.toEqual("https://private.test/signed");
    state.actor.mockResolvedValue({ ...actor, guestId: '66666666-6666-4666-8666-666666666666' });
    await expect(readPublishedCommentAsset(assetId)).rejects.toThrow();
    state.actor.mockResolvedValue(actor);
    await pg.exec(`UPDATE manga SET is_hidden=true`);
    await expect(readPublishedCommentAsset(assetId)).rejects.toThrow();
    state.actor.mockResolvedValue({ kind: 'member', userId: 'admin', role: 'admin' });
    await expect(readPublishedCommentAsset(assetId)).resolves.toEqual("https://private.test/signed");
    state.actor.mockRejectedValue(new Error('banned or revoked admin'));
    await expect(readPublishedCommentAsset(assetId)).rejects.toThrow('banned or revoked admin');
  });
  it('preserves guest pending-image ownership after logging into a member account', async () => {
    await pg.exec(`UPDATE private.comment_assets SET state='published',comment_id='${commentId}'; UPDATE comments SET status='pending' WHERE id='${commentId}'`);
    state.actor.mockResolvedValue({ kind: 'member', userId: 'member', role: 'user' });
    state.guest.mockResolvedValue(actor);
    await expect(readPublishedCommentAsset(assetId)).resolves.toEqual("https://private.test/signed");
    state.guest.mockResolvedValue(null);
    await expect(readPublishedCommentAsset(assetId)).rejects.toThrow();
  });
  it('does not let a retained banned guest credential disrupt member identity or grant image rights', async () => {
    await pg.exec(`UPDATE private.comment_assets SET state='published',comment_id='${commentId}'; UPDATE comments SET status='pending' WHERE id='${commentId}'`);
    state.actor.mockResolvedValue({ kind: 'member', userId: 'member', role: 'user' });
    state.guest.mockRejectedValue(new ForbiddenCommentError());
    await expect(readPublishedCommentAsset(assetId)).rejects.toBeInstanceOf(NotFoundCommentError);
    state.guest.mockRejectedValue(new Error('database unavailable'));
    await expect(readPublishedCommentAsset(assetId)).rejects.toThrow('database unavailable');
    expect(state.get).not.toHaveBeenCalled();
  });
  it('deletes attached objects immediately and retains exact metadata on failed deletion for retry', async () => {
    await pg.exec(`UPDATE private.comment_assets SET state='published',comment_id='${commentId}'`);
    state.remove.mockRejectedValueOnce(new Error('R2 unavailable'));
    await expect(database.transaction(tx => retireCommentAssets(tx as never, commentId))).rejects.toThrow('R2 unavailable');
    expect((await pg.query(`SELECT object_key,state FROM private.comment_assets`)).rows).toEqual([{object_key:'comments/test.webp',state:'published'}]);
    await database.transaction(tx => retireCommentAssets(tx as never, commentId));
    expect(state.remove).toHaveBeenCalledWith('comments/test.webp');
    expect((await pg.query(`SELECT id FROM private.comment_assets`)).rows).toHaveLength(0);
    await database.transaction(tx => retireCommentAssets(tx as never, commentId));
    expect(state.remove).toHaveBeenCalledTimes(2);
  });
  it('publishes direct R2 URLs but never publishes pending attachments', async () => {
    await database.transaction(async tx => {
      await reserveCommentAsset(tx as never, actor, assetId, commentId);
      expect(await finalizeCommentAsset(tx as never,assetId,commentId,'pending')).toBeNull();
    });
    expect(state.publish).not.toHaveBeenCalled();
    const result = await decorateCommentImagePreviews([{id:commentId,status:'pending',imageUrl:null}]);
    expect<unknown>(result[0].imageUrl).toBe('https://private.test/signed');
    expect(state.preview).toHaveBeenCalledWith('comments/test.webp');
  });
  it('persists attached state only after public copy succeeds and returns its direct URL', async () => {
    state.publish.mockRejectedValueOnce(new Error('copy failed'));
    await expect(database.transaction(async tx => { await reserveCommentAsset(tx as never,actor,assetId,commentId); await finalizeCommentAsset(tx as never,assetId,commentId); })).rejects.toThrow('copy failed');
    expect((await pg.query(`SELECT state FROM private.comment_assets`)).rows).toEqual([{state:'staged'}]);
    await database.transaction(async tx => {
      await reserveCommentAsset(tx as never,actor,assetId,commentId);
      expect(await finalizeCommentAsset(tx as never,assetId,commentId)).toBe('https://comments.test/comments/test.webp');
    });
    expect(state.publish).toHaveBeenCalledWith('comments/test.webp');
  });
  it('compensates public copies after rollback without deleting private staging or a concurrent attachment', async () => {
    await expect(database.transaction(async tx => {
      await reserveCommentAsset(tx as never,actor,assetId,commentId);
      await finalizeCommentAsset(tx as never,assetId,commentId);
      throw new Error('commit failed');
    })).rejects.toThrow('commit failed');
    await rollbackCommentAssetPublication(assetId);
    expect(state.unpublish).toHaveBeenCalledTimes(1);expect(state.unpublish).toHaveBeenCalledWith('comments/test.webp');
    expect(state.remove).not.toHaveBeenCalled();
    await database.transaction(async tx => {
      await reserveCommentAsset(tx as never,actor,assetId,commentId);
      await finalizeCommentAsset(tx as never,assetId,commentId);
    });
    await rollbackCommentAssetPublication(assetId);
    expect(state.unpublish).toHaveBeenCalledTimes(1);
  });
  it('discards only published private staging after commit and retries a failed release through cleanup',async()=>{
    await pg.exec(`UPDATE private.comment_assets SET state='published',comment_id='${commentId}'; UPDATE comments SET image_url='https://comments.test/comments/test.webp' WHERE id='${commentId}'`);
    state.discard.mockRejectedValueOnce(new Error('private delete failed'));
    await expect(discardPublishedCommentStaging(commentId)).rejects.toThrow('private delete failed');
    expect((await pg.query(`SELECT object_key,state FROM private.comment_assets`)).rows).toEqual([{object_key:'comments/test.webp',state:'published'}]);
    await cleanupCommentAssets();
    expect(state.discard).toHaveBeenCalledTimes(2);
    expect(state.remove).not.toHaveBeenCalled();expect(state.unpublish).not.toHaveBeenCalled();
    await pg.exec(`UPDATE comments SET status='pending' WHERE id='${commentId}'`);
    await discardPublishedCommentStaging(commentId);await cleanupCommentAssets();
    expect(state.discard).toHaveBeenCalledTimes(2);
  });
  it('rejects finalization without a matching reservation', async () => {
    await expect(database.transaction(tx => finalizeCommentAsset(tx as never, assetId, commentId))).rejects.toThrow();
  });
  it('cleans expired session credentials while retaining author identities and history', async () => {
    await pg.exec(`INSERT INTO private.comment_guest_sessions(guest_id,token_hash,expires_at) VALUES ('${guest}',repeat('a',64),now()-interval '1 second'),('${guest}',repeat('b',64),now()+interval '1 hour')`);
    await cleanupCommentAssets();
    expect((await pg.query(`SELECT id FROM private.comment_guest_sessions WHERE guest_id='${guest}'`)).rows).toHaveLength(1);
    expect((await pg.query(`SELECT id FROM private.comment_guests WHERE id='${guest}'`)).rows).toHaveLength(1);
    expect((await pg.query(`SELECT id FROM comments WHERE guest_id='${guest}'`)).rows).toHaveLength(2);
  });
});

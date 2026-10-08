import { stubEnv, restoreEnvs } from "./helpers/env";
import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it, jest, mock } from 'bun:test';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { createHmac } from 'node:crypto';
import type { CommentActor } from '@/lib/comments/identity';
const state = { database: null as unknown };
const schema = await import('@/db/schema');
const pg = new PGlite();
const database = drizzle(pg, { schema });
state.database = database;
mock.module('@/db', () => ({ get db() { return state.database; } }));
const { consumeCommentLimit, consumeGuestCreationLimit } = await import('@/lib/comments/abuse');


let clock: ReturnType<typeof jest.spyOn<typeof Date, "now">>;
const start = new Date('2026-10-07T00:00:00.000Z').getTime();
const member: CommentActor = { kind:'member',userId:'member-one',role:'user',name:'Member',image:null };
const guest: CommentActor = { kind:'guest',guestId:'11111111-1111-4111-8111-111111111111',sessionId:'session-one',name:'Guest',publicCode:'AA11',verifiedUntil:null };
const headers = () => new Headers();
async function rows() { return (await pg.query<{key:string;count:number;bytes:number}>('SELECT key,count,bytes FROM private.comment_rate_limits ORDER BY key')).rows; }
beforeAll(async () => {
  await pg.exec('CREATE SCHEMA private; CREATE TABLE private.comment_rate_limits(key text PRIMARY KEY,window_start timestamptz NOT NULL,count integer NOT NULL DEFAULT 0,bytes bigint NOT NULL DEFAULT 0,expires_at timestamptz NOT NULL);');
},30000);
afterAll(async () => pg.close());
beforeEach(async () => {
  stubEnv('VERCEL','');stubEnv('GUEST_COMMENTS_ENABLED','true');stubEnv('GUEST_COMMENT_UPLOADS_ENABLED','true');stubEnv('COMMENT_ABUSE_SECRET','test-network-key');
  clock = jest.spyOn(Date,'now').mockReturnValue(start);
  await pg.exec('DELETE FROM private.comment_rate_limits');
});
afterEach(()=>{jest.restoreAllMocks();restoreEnvs();});
describe('durable comment quotas with PostgreSQL upserts',()=>{
  it('enforces the burst ceiling atomically across concurrent requests',async()=>{
    const result=await Promise.allSettled(Array.from({length:12},()=>consumeCommentLimit(guest,headers(),'comment')));
    expect(result.filter(item=>item.status==='fulfilled')).toHaveLength(4);
    expect(result.filter(item=>item.status==='rejected')).toHaveLength(8);
    const counters=await rows();
    expect(counters.find(row=>row.key.startsWith('comment:burst:'))?.count).toBe(4);
    expect(counters.find(row=>row.key.startsWith('comment:guest:'))?.count).toBe(12);
  });
  it('never increments the durable 15 minute quota past twenty under contention',async()=>{
    const result=await Promise.allSettled(Array.from({length:30},()=>consumeCommentLimit(guest,headers(),'comment')));
    expect(result.filter(item=>item.status==='fulfilled')).toHaveLength(4);
    expect((await rows()).find(row=>row.key.startsWith('comment:guest:'))?.count).toBe(20);
  });
  it('allows twenty comments across burst windows then refuses another within the same 15 minutes',async()=>{
    for(let batch=0;batch<5;batch++) {
      clock.mockReturnValue(start+batch*30000);
      await Promise.all(Array.from({length:4},()=>consumeCommentLimit(member,headers(),'comment')));
    }
    clock.mockReturnValue(start+5*30000);
    await expect(consumeCommentLimit(member,headers(),'comment')).rejects.toMatchObject({status:429});
    expect((await rows()).find(row=>row.key.startsWith('comment:member:'))?.count).toBe(20);
  });
  it('counts upload bytes atomically and refuses a quota-overflowing update',async()=>{
    const size=8*1024*1024;
    const result=await Promise.allSettled(Array.from({length:4},()=>consumeCommentLimit(guest,headers(),'upload',size)));
    expect(result.filter(item=>item.status==='fulfilled')).toHaveLength(3);
    const quota=(await rows()).find(row=>row.key.startsWith('upload:guest:'))!;
    expect(quota.count).toBe(3);expect(Number(quota.bytes)).toBe(24*1024*1024);
  });
  it('fails closed if PostgreSQL cannot update a quota',async()=>{
    const broken={insert:jest.fn(()=>{throw new Error('database unavailable');})};
    await expect(consumeCommentLimit(guest,headers(),'comment',0,broken as unknown as Parameters<typeof consumeCommentLimit>[4])).rejects.toThrow('database unavailable');
    expect(await rows()).toHaveLength(0);
  });
  it('refuses missing trusted Vercel IP even if client forwarded headers are provided',async()=>{
    stubEnv('VERCEL','1');
    const requestHeaders=new Headers({'x-forwarded-for':'203.0.113.10','x-real-ip':'203.0.113.10'});
    await expect(consumeCommentLimit(guest,requestHeaders,'comment')).rejects.toMatchObject({status:429});
    await expect(consumeGuestCreationLimit(requestHeaders)).rejects.toMatchObject({status:429});
    expect(await rows()).toHaveLength(0);
  });
  it('keys network quota from trusted edge IP with HMAC, ignoring spoofable headers',async()=>{
    stubEnv('VERCEL','1');
    const trusted='203.0.113.10';
    await consumeCommentLimit(guest,new Headers({'x-vercel-forwarded-for':trusted,'x-forwarded-for':'198.51.100.1'}),'comment');
    await consumeCommentLimit(member,new Headers({'x-vercel-forwarded-for':trusted,'x-forwarded-for':'198.51.100.200'}),'comment');
    const network=(await rows()).filter(row=>row.key.startsWith('comment:network:'));
    expect(network).toHaveLength(1);expect(network[0].count).toBe(2);
    expect(network[0].key).toContain(createHmac('sha256','test-network-key').update(trusted).digest('hex'));
    expect(network[0].key).not.toContain(trusted);
  });
  it('does not treat a client-supplied forwarded IP as trusted off Vercel',async()=>{
    await consumeCommentLimit(guest,new Headers({'x-forwarded-for':'203.0.113.10','x-vercel-forwarded-for':'203.0.113.10'}),'comment');
    expect((await rows()).some(row=>row.key.includes(':network:'))).toBe(false);
  });
  it('supports one hundred guest creations in 15 minutes while preserving a twenty per 30 seconds ceiling',async()=>{
    for(let batch=0;batch<5;batch++) {
      clock.mockReturnValue(start+batch*30000);
      await Promise.all(Array.from({length:20},()=>consumeGuestCreationLimit(headers())));
    }
    clock.mockReturnValue(start+5*30000);
    await expect(consumeGuestCreationLimit(headers())).rejects.toMatchObject({status:429});
    expect((await rows()).find(row=>row.key.startsWith('guest:create:') && !row.key.includes(':burst:'))?.count).toBe(100);
  });
  it('limits a guest creation burst under concurrent requests',async()=>{
    const result=await Promise.allSettled(Array.from({length:25},()=>consumeGuestCreationLimit(headers())));
    expect(result.filter(item=>item.status==='fulfilled')).toHaveLength(20);
    expect((await rows()).find(row=>row.key.includes('guest:create:burst:'))?.count).toBe(20);
  });
  it('pauses guest comments and uploads through switches without blocking members or reports',async()=>{
    stubEnv('GUEST_COMMENTS_ENABLED','false');
    await expect(consumeCommentLimit(guest,headers(),'comment')).rejects.toMatchObject({status:503,code:'GUEST_DISABLED'});
    await expect(consumeCommentLimit(guest,headers(),'upload',100)).rejects.toMatchObject({status:503});
    expect(await rows()).toHaveLength(0);
    await expect(consumeCommentLimit(member,headers(),'comment')).resolves.toBeUndefined();
    await expect(consumeCommentLimit(guest,headers(),'report')).resolves.toBeUndefined();
  });
  it('can pause only guest image uploads while allowing their text comments',async()=>{
    stubEnv('GUEST_COMMENT_UPLOADS_ENABLED','false');
    await expect(consumeCommentLimit(guest,headers(),'upload',100)).rejects.toMatchObject({status:503});
    await expect(consumeCommentLimit(guest,headers(),'comment')).resolves.toBeUndefined();
    await expect(consumeCommentLimit(member,headers(),'upload',100)).resolves.toBeUndefined();
  });
  it('allows twenty admin moderation actions per burst and denies guest or ordinary member callers',async()=>{
    await expect(consumeCommentLimit(guest,headers(),'moderation')).rejects.toMatchObject({status:403});
    await expect(consumeCommentLimit(member,headers(),'moderation')).rejects.toMatchObject({status:403});
    const admin:CommentActor={...member,role:'admin'};
    const result=await Promise.allSettled(Array.from({length:25},()=>consumeCommentLimit(admin,headers(),'moderation')));
    expect(result.filter(item=>item.status==='fulfilled')).toHaveLength(20);
    expect((await rows()).find(row=>row.key.startsWith('moderation:burst:'))?.count).toBe(20);
  });
});

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
const state=vi.hoisted(()=>({database:null as unknown}));
vi.mock('@/db',()=>({get db(){return state.database;}}));
vi.mock('@/lib/auth',()=>({auth:{api:{getSession:vi.fn()}}}));
vi.mock('@/lib/comments/assets',()=>({reserveCommentAsset:vi.fn(),finalizeCommentAsset:vi.fn(),retireCommentAssets:vi.fn()}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
import { listComments,listCommentReplies } from '@/lib/comments';
import { GET } from '@/app/api/comments/[commentId]/replies/route';
import * as schema from '@/db/schema';
const pg=new PGlite();const database=drizzle(pg,{schema});
const mangaId='11111111-1111-4111-8111-111111111111';
const otherManga='22222222-2222-4222-8222-222222222222';
const rootId='33333333-3333-4333-8333-333333333333';
const otherRoot='44444444-4444-4444-8444-444444444444';
const guestId='55555555-5555-4555-8555-555555555555';
const replyId=(index:number)=>`66666666-6666-4666-8666-${index.toString().padStart(12,'0')}`;
beforeAll(async()=>{
  state.database=database;
  await pg.exec(`CREATE SCHEMA private;
    CREATE TABLE private.comment_guests(id uuid PRIMARY KEY,name text,public_code text);
    CREATE TABLE profiles(id text PRIMARY KEY,name text,username text,image text);
    CREATE TABLE manga(id uuid PRIMARY KEY,slug text,is_hidden boolean DEFAULT false,pages jsonb);
    CREATE TABLE comments(id uuid PRIMARY KEY,content text NOT NULL,image_url text,manga_id uuid,user_id text,guest_id uuid,author_name text,guest_public_code text,status text DEFAULT 'published',idempotency_key text,request_hash text,image_index integer,parent_id uuid,vote_score integer DEFAULT 0,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
    INSERT INTO private.comment_guests VALUES('${guestId}','Guest','AB11');
    INSERT INTO manga VALUES('${mangaId}','work',false,'["page"]'),('${otherManga}','other',false,'["page"]');
    INSERT INTO comments(id,content,manga_id,guest_id) VALUES('${rootId}','Root','${mangaId}','${guestId}'),('${otherRoot}','Other root','${mangaId}','${guestId}');`);
  for(let index=1;index<=43;index++) await pg.query(`INSERT INTO comments(id,content,manga_id,guest_id,parent_id,created_at) VALUES($1,$2,$3,$4,$5,$6::timestamptz)`,[replyId(index),`Reply ${index}`,mangaId,guestId,rootId,`2026-10-07T01:00:00.${(123000+index).toString()}Z`]);
},30000);
afterAll(async()=>pg.close());
beforeEach(async()=>{await pg.exec(`UPDATE manga SET is_hidden=false; UPDATE comments SET status='published'; UPDATE comments SET manga_id='${mangaId}',image_index=NULL,created_at='2026-10-07T01:00:00.123000Z'::timestamptz+right(id::text,12)::integer*interval '1 microsecond' WHERE parent_id='${rootId}';`);});
describe('public reply pagination with PostgreSQL ordering and visibility',()=>{
  it('exposes a continuation when the first twenty replies are displayed and reaches all forty-three without duplicates',async()=>{
    const roots=await listComments({mangaId});
    const root=roots.comments.find(c=>c.id===rootId)!;
    expect(root.replies).toHaveLength(20);expect(root.repliesNextCursor).toBeTruthy();
    const seen=(root.replies || []).map(c=>c.id);
    let cursor=root.repliesNextCursor;
    while(cursor){const page=await listCommentReplies({commentId:rootId,cursor});seen.push(...page.comments.map(c=>c.id));cursor=page.nextCursor;}
    expect(seen).toHaveLength(43);expect(new Set(seen).size).toBe(43);
    expect(seen).toEqual(Array.from({length:43},(_,index)=>replyId(index+1)));
  });
  it('supports identical timestamps through the UUID tie breaker',async()=>{
    await pg.exec(`UPDATE comments SET created_at='2026-10-07T01:00:00.123456Z' WHERE parent_id='${rootId}';`);
    let cursor:string|null=null;const seen:string[]=[];
    do{const page=await listCommentReplies({commentId:rootId,cursor,limit:7});seen.push(...page.comments.map(c=>c.id));cursor=page.nextCursor;}while(cursor);
    expect(seen).toEqual(Array.from({length:43},(_,index)=>replyId(index+1)));
  });
  it('omits private owner fields and hides pending or moderated replies',async()=>{
    await pg.exec(`UPDATE comments SET status='pending' WHERE id='${replyId(1)}'; UPDATE comments SET status='hidden' WHERE id='${replyId(2)}';`);
    const page=await listCommentReplies({commentId:rootId,limit:50});
    expect(page.comments).toHaveLength(41);
    expect(page.comments.every(c=>c.status==='published')).toBe(true);
    const raw=JSON.stringify(page);expect(raw).not.toMatch(/guestId|userId|idempotencyKey|requestHash|tokenHash/);
  });
  it('keeps replies readable for a deleted parent but rejects hidden and pending parents',async()=>{
    await pg.exec(`UPDATE comments SET status='deleted' WHERE id='${rootId}';`);
    expect((await listCommentReplies({commentId:rootId})).comments).toHaveLength(20);
    for(const status of ['hidden','pending']){await pg.exec(`UPDATE comments SET status='${status}' WHERE id='${rootId}';`);await expect(listCommentReplies({commentId:rootId})).rejects.toMatchObject({status:404});}
  });
  it('rejects hidden manga and excludes legacy cross-manga or cross-page replies',async()=>{
    await pg.exec(`UPDATE comments SET manga_id='${otherManga}' WHERE id='${replyId(1)}'; UPDATE comments SET image_index=0 WHERE id='${replyId(2)}';`);
    expect((await listCommentReplies({commentId:rootId,limit:50})).comments).toHaveLength(41);
    await pg.exec(`UPDATE manga SET is_hidden=true WHERE id='${mangaId}';`);
    await expect(listCommentReplies({commentId:rootId})).rejects.toMatchObject({status:404});
  });
  it('rejects nested parents, invalid cursors, unsafe page sizes and invalid UUIDs',async()=>{
    await expect(listCommentReplies({commentId:replyId(1)})).rejects.toMatchObject({status:404});
    await expect(listCommentReplies({commentId:rootId,cursor:'bad'})).rejects.toMatchObject({status:400});
    await expect(listCommentReplies({commentId:rootId,limit:51})).rejects.toMatchObject({status:400});
    await expect(listCommentReplies({commentId:'bad'})).rejects.toMatchObject({status:400});
  });
  it('serves the continuation endpoint with a no-store public DTO and validates malformed requests',async()=>{
    const response=await GET(new Request(`https://magga.test/api/comments/${rootId}/replies?limit=3`),{params:Promise.resolve({commentId:rootId})});
    expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toBe('no-store');
    const result=await response.json();expect(result.comments).toHaveLength(3);expect(result.nextCursor).toBeTruthy();
    const bad=await GET(new Request(`https://magga.test/api/comments/${rootId}/replies?limit=invalid`),{params:Promise.resolve({commentId:rootId})});expect(bad.status).toBe(400);
  });
});

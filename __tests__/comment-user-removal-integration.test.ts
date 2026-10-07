import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { readFileSync } from 'node:fs';
import { NextRequest } from 'next/server';
const state=vi.hoisted(()=>({database:null as unknown,admin:vi.fn(),remove:vi.fn()}));
vi.mock('@/lib/storage/comment-private',()=>({getCommentPrivateStorage:()=>({delete:state.remove})}));
vi.mock('@/db',()=>({get db(){return state.database;}}));
vi.mock('@/lib/comments/moderation',()=>({requireModerationAdmin:state.admin}));
vi.mock('@/lib/auth',()=>({auth:{api:{getSession:vi.fn()}}}));
import { deleteUserPreservingComments } from '@/lib/comments/user-removal';
import { ForbiddenCommentError } from '@/lib/comments/types';
import { DELETE } from '@/app/api/admin/users/[id]/route';
import * as schema from '@/db/schema';
const pg=new PGlite();const database=drizzle(pg,{schema});
const uuid=(n:number)=>`11111111-1111-4111-8111-${n.toString().padStart(12,'0')}`;
const ownRoot=uuid(1),otherReply=uuid(2),otherRoot=uuid(3),ownReply=uuid(4);
const ownLinkedAsset=uuid(5),ownStagedAsset=uuid(6),otherAsset=uuid(7);
const ownReport=uuid(8),otherReport=uuid(9),unrelatedReport=uuid(10);
const ownEvent=uuid(11),linkedEvent=uuid(12),otherEvent=uuid(13);
beforeAll(async()=>{
  state.database=database;
  await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated;
    CREATE TABLE profiles(id text PRIMARY KEY);
    CREATE TABLE comments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),content text NOT NULL,user_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,parent_id uuid CONSTRAINT comments_parent_id_fkey REFERENCES comments(id) ON DELETE CASCADE,image_url text,vote_score integer DEFAULT 0,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
    CREATE TABLE comment_votes(id uuid PRIMARY KEY,user_id text REFERENCES profiles(id) ON DELETE CASCADE,comment_id uuid REFERENCES comments(id),value integer);
    CREATE TABLE sessions(id text PRIMARY KEY,user_id text REFERENCES profiles(id) ON DELETE CASCADE);
    CREATE TABLE accounts(id text PRIMARY KEY,user_id text REFERENCES profiles(id) ON DELETE CASCADE);`);
  await pg.exec(readFileSync('db/migrations/0013_guest_comments.sql','utf8'));
},30000);
afterAll(async()=>pg.close());
beforeEach(async()=>{
  vi.clearAllMocks();state.remove.mockResolvedValue(undefined);state.admin.mockResolvedValue({kind:'member',userId:'admin',role:'admin',name:'Admin',image:null});
  await pg.exec(`DROP TRIGGER IF EXISTS reject_profile_delete ON profiles;
    DELETE FROM private.comment_moderation_events; DELETE FROM private.comment_reports; DELETE FROM private.comment_assets; DELETE FROM comment_votes; DELETE FROM comments WHERE parent_id IS NOT NULL; DELETE FROM comments; DELETE FROM profiles; DELETE FROM private.comment_guests;
    INSERT INTO profiles VALUES('target'),('other'),('admin');
    INSERT INTO sessions VALUES('target-session','target'),('other-session','other'); INSERT INTO accounts VALUES('target-account','target'),('other-account','other');
    INSERT INTO comments(id,content,user_id,image_url,idempotency_key,request_hash,author_name) VALUES('${ownRoot}','Target root','target','/original-target.webp','own-key','own-hash','Personal target name'),('${otherRoot}','Other root','other','/other.webp','other-key','other-hash','Other name');
    INSERT INTO comments(id,content,user_id,parent_id,idempotency_key,request_hash) VALUES('${otherReply}','Other person reply','other','${ownRoot}','other-reply-key','other-reply-hash'),('${ownReply}','Target reply','target','${otherRoot}','own-reply-key','own-reply-hash');
    INSERT INTO comment_votes VALUES('${uuid(14)}','target','${otherRoot}',1),('${uuid(15)}','other','${ownRoot}',1);
    UPDATE comments SET vote_score=1 WHERE id IN ('${ownRoot}','${otherRoot}');
    INSERT INTO private.comment_assets(id,user_id,object_key,content_type,bytes,width,height,state,expires_at,comment_id) VALUES('${ownLinkedAsset}','target','comments/target-linked.webp','image/webp',100,10,10,'published',now()+interval '100 days','${ownRoot}'),('${ownStagedAsset}','target','comments/target-staged.webp','image/webp',100,10,10,'staged',now()+interval '1 hour',NULL),('${otherAsset}','other','comments/other.webp','image/webp',100,10,10,'published',now()+interval '100 days','${otherRoot}');
    INSERT INTO private.comment_reports(id,comment_id,user_id,reason,reviewer_user_id) VALUES('${ownReport}','${otherRoot}','target','spam','admin'),('${otherReport}','${ownRoot}','other','abuse','target'),('${unrelatedReport}','${otherRoot}','admin','other','admin');
    INSERT INTO private.comment_moderation_events(id,actor_user_id,comment_id,report_id,action) VALUES('${ownEvent}','target','${otherRoot}',NULL,'hide'),('${linkedEvent}','admin','${otherRoot}','${ownReport}','resolve-report'),('${otherEvent}','admin','${ownRoot}','${otherReport}','resolve-report');`);
});
describe('admin account deletion preserves comment conversations transactionally',()=>{
  it('removes the account and credentials while preserving other authors replies and comments',async()=>{
    expect(await deleteUserPreservingComments('target')).toEqual({success:true});
    expect((await pg.query(`SELECT id FROM profiles ORDER BY id`)).rows).toEqual([{id:'admin'},{id:'other'}]);
    expect((await pg.query(`SELECT id FROM sessions`)).rows).toEqual([{id:'other-session'}]);
    expect((await pg.query(`SELECT id FROM accounts`)).rows).toEqual([{id:'other-account'}]);
    expect((await pg.query(`SELECT content,parent_id,user_id,status FROM comments WHERE id='${otherReply}'`)).rows).toEqual([{content:'Other person reply',parent_id:ownRoot,user_id:'other',status:'published'}]);
    expect((await pg.query(`SELECT content,user_id,image_url,idempotency_key FROM comments WHERE id='${otherRoot}'`)).rows).toEqual([{content:'Other root',user_id:'other',image_url:'/other.webp',idempotency_key:'other-key'}]);
    expect((await pg.query(`SELECT id FROM comments`)).rows).toHaveLength(4);
  });
  it('anonymizes only the removed members comments with a banned tombstone that has no login session',async()=>{
    await deleteUserPreservingComments('target');
    const comments=(await pg.query<{guest_id:string;user_id:null;content:string;image_url:null;status:string;idempotency_key:null;request_hash:null;author_name:string}>(`SELECT guest_id,user_id,content,image_url,status,idempotency_key,request_hash,author_name FROM comments WHERE id IN ('${ownRoot}','${ownReply}')`)).rows;
    expect(comments).toHaveLength(2);
    for(const comment of comments) expect(comment).toMatchObject({user_id:null,content:'',image_url:null,status:'deleted',idempotency_key:null,request_hash:null,author_name:'ผู้ใช้ที่ถูกลบ'});
    expect(new Set(comments.map(comment=>comment.guest_id)).size).toBe(1);
    const guests=(await pg.query<{name:string;is_banned:boolean;public_code:string}>(`SELECT name,is_banned,public_code FROM private.comment_guests`)).rows;
    expect(guests).toHaveLength(1);expect(guests[0]).toMatchObject({name:'ผู้ใช้ที่ถูกลบ',is_banned:true});expect(String(guests[0].public_code)).not.toContain('target');
    expect((await pg.query(`SELECT id FROM private.comment_guest_sessions`)).rows).toHaveLength(0);
  });
  it('deletes exact own linked and staged R2 objects immediately and preserves other assets',async()=>{
    await deleteUserPreservingComments('target');
    expect(state.remove.mock.calls).toEqual([['comments/target-linked.webp'],['comments/target-staged.webp']]);
    expect((await pg.query(`SELECT id,object_key,user_id,state FROM private.comment_assets`)).rows).toEqual([{id:otherAsset,object_key:'comments/other.webp',user_id:'other',state:'published'}]);
  });
  it('fails account deletion and keeps tracked keys for retry when storage removal fails',async()=>{
    state.remove.mockRejectedValueOnce(new Error('R2 unavailable'));
    await expect(deleteUserPreservingComments('target')).rejects.toThrow('R2 unavailable');
    expect((await pg.query(`SELECT id FROM profiles WHERE id='target'`)).rows).toHaveLength(1);
    expect((await pg.query(`SELECT object_key FROM private.comment_assets WHERE user_id='target'`)).rows).toHaveLength(2);
    await deleteUserPreservingComments('target');
    expect((await pg.query(`SELECT id FROM profiles WHERE id='target'`)).rows).toHaveLength(0);
  });
  it('removes only own reports and blocking audit references while clearing their reviewer assignment elsewhere',async()=>{
    await deleteUserPreservingComments('target');
    expect((await pg.query(`SELECT id,reviewer_user_id FROM private.comment_reports ORDER BY id`)).rows).toEqual([{id:otherReport,reviewer_user_id:null},{id:unrelatedReport,reviewer_user_id:'admin'}]);
    expect((await pg.query(`SELECT id,actor_user_id,report_id FROM private.comment_moderation_events`)).rows).toEqual([{id:otherEvent,actor_user_id:'admin',report_id:otherReport}]);
  });
  it('subtracts only the deleted members vote contribution and keeps other voters intact',async()=>{
    await pg.exec(`INSERT INTO comment_votes VALUES('${uuid(16)}','admin','${otherRoot}',1),('${uuid(17)}','target','${otherReply}',-1); UPDATE comments SET vote_score=2 WHERE id='${otherRoot}'; UPDATE comments SET vote_score=-1 WHERE id='${otherReply}';`);
    await deleteUserPreservingComments('target');
    expect((await pg.query(`SELECT vote_score FROM comments WHERE id='${otherRoot}'`)).rows).toEqual([{vote_score:1}]);
    expect((await pg.query(`SELECT vote_score FROM comments WHERE id='${otherReply}'`)).rows).toEqual([{vote_score:0}]);
    expect((await pg.query(`SELECT vote_score FROM comments WHERE id='${ownRoot}'`)).rows).toEqual([{vote_score:1}]);
    expect((await pg.query(`SELECT user_id,value FROM comment_votes ORDER BY user_id`)).rows).toEqual([{user_id:'admin',value:1},{user_id:'other',value:1}]);
  });
  it('rolls back ownership, tombstones, asset state and reports if final profile deletion fails',async()=>{
    await pg.exec(`CREATE OR REPLACE FUNCTION reject_profile_delete_fn() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'simulated deletion failure'; END $$ LANGUAGE plpgsql; CREATE TRIGGER reject_profile_delete BEFORE DELETE ON profiles FOR EACH ROW EXECUTE FUNCTION reject_profile_delete_fn();`);
    await expect(deleteUserPreservingComments('target')).rejects.toThrow();
    expect((await pg.query(`SELECT id FROM profiles WHERE id='target'`)).rows).toHaveLength(1);
    expect((await pg.query(`SELECT user_id,content,status FROM comments WHERE id='${ownRoot}'`)).rows).toEqual([{user_id:'target',content:'Target root',status:'published'}]);
    expect((await pg.query(`SELECT id FROM private.comment_guests`)).rows).toHaveLength(0);
    expect((await pg.query(`SELECT user_id,state FROM private.comment_assets WHERE id='${ownLinkedAsset}'`)).rows).toEqual([{user_id:'target',state:'published'}]);
    expect((await pg.query(`SELECT vote_score FROM comments WHERE id='${otherRoot}'`)).rows).toEqual([{vote_score:1}]);
    expect((await pg.query(`SELECT id FROM comment_votes WHERE user_id='target'`)).rows).toHaveLength(1);
    expect((await pg.query(`SELECT id FROM private.comment_reports`)).rows).toHaveLength(3);expect((await pg.query(`SELECT id FROM private.comment_moderation_events`)).rows).toHaveLength(3);
  });
  it('returns not found without creating records and validates the target identifier',async()=>{
    await expect(deleteUserPreservingComments('missing')).rejects.toMatchObject({status:404});
    await expect(deleteUserPreservingComments('')).rejects.toMatchObject({status:400});
    expect((await pg.query(`SELECT id FROM private.comment_guests`)).rows).toHaveLength(0);
  });
  it('supports deletion without comments or assets without creating an unused tombstone',async()=>{
    await pg.exec(`INSERT INTO profiles VALUES('empty');`);await deleteUserPreservingComments('empty');
    expect((await pg.query(`SELECT id FROM private.comment_guests`)).rows).toHaveLength(0);
  });
  it('integrates the authenticated admin route, prevents self deletion and rejects denied admins before writes',async()=>{
    const request=()=>new NextRequest('https://magga.test/api/admin/users/target',{method:'DELETE',headers:{origin:'https://magga.test'}});
    const self=await DELETE(request(),{params:Promise.resolve({id:'admin'})});expect(self.status).toBe(400);
    state.admin.mockRejectedValueOnce(new ForbiddenCommentError());
    expect((await DELETE(request(),{params:Promise.resolve({id:'target'})})).status).toBe(403);expect((await pg.query(`SELECT id FROM profiles WHERE id='target'`)).rows).toHaveLength(1);
    const response=await DELETE(request(),{params:Promise.resolve({id:'target'})});expect(response.status).toBe(200);expect(await response.json()).toEqual({success:true});
    expect(state.admin).toHaveBeenLastCalledWith(expect.any(NextRequest),true);
  });
});

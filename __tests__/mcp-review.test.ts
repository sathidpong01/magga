import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { db } from '@/db';
import { createDraftService } from '@/lib/mcp/drafts';
import { createReviewService, createBrowserReviewService } from '@/lib/mcp/review';
import { createKeyAdmin } from '@/lib/mcp/keys';
import { authenticate, type Principal } from '@/lib/mcp/auth';
import { createDependencies } from '@/lib/mcp/dependencies';
import { handleMcp } from '@/lib/mcp/http';

describe('client research, review and application', () => {
  const pg = new PGlite(); const database = drizzle(pg) as unknown as typeof db;
  const target = randomUUID(); const author = randomUUID(); const existingTag = randomUUID(); const addedTag = randomUUID(); const existingCategory = randomUUID();
  const admin = createKeyAdmin(database); const drafts = createDraftService(database); const invalidate = vi.fn(async () => {});
  const review = createReviewService(database, invalidate); const deps = createDependencies(database);
  let key: Principal; let token: string;
  const get = async (id: string) => await review.get(id, key) as { review_token: string; status: string };
  const makeTags = async () => {
    const id = randomUUID();
    await drafts.create({ request_id: id, kind: 'manga_tags', target: { type: 'manga', id: target }, proposal: { tag_names: ['New'] }, sources: [] }, key, randomUUID());
    return id;
  };
  beforeAll(async () => {
    await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated;
      CREATE TABLE profiles (id text PRIMARY KEY, role text DEFAULT 'admin', is_banned boolean DEFAULT false, banned boolean DEFAULT false);
      INSERT INTO profiles(id) VALUES ('owner'),('other');
      CREATE TABLE manga (id uuid PRIMARY KEY, title text UNIQUE, slug text, author_id uuid, category_id uuid, is_hidden boolean DEFAULT false, updated_at timestamptz DEFAULT now());
      CREATE TABLE authors (id uuid PRIMARY KEY, name text, profile_url text, social_links text, updated_at timestamptz DEFAULT now());
      CREATE TABLE categories (id uuid PRIMARY KEY, name text UNIQUE); CREATE TABLE tags (id uuid PRIMARY KEY, name text UNIQUE);
      CREATE TABLE manga_tags (manga_id uuid REFERENCES manga(id), tag_id uuid REFERENCES tags(id), PRIMARY KEY(manga_id,tag_id));
      INSERT INTO categories(id,name) VALUES ('${existingCategory}','MM');
      INSERT INTO manga(id,title,slug,category_id) VALUES ('${target}','Original','original','${existingCategory}');
      INSERT INTO authors(id,name) VALUES ('${author}','Artist');
      INSERT INTO tags VALUES ('${existingTag}','Existing'),('${addedTag}','New');
      INSERT INTO manga_tags VALUES ('${target}','${existingTag}');`);
    await pg.exec(readFileSync('db/migrations/0008_mcp_access_and_drafts.sql','utf8'));
    await pg.exec(readFileSync('db/migrations/0010_mcp_partial_approval.sql','utf8'));
    const created = await admin.issue({ owner: 'owner', name: 'client', scopes: ['catalog:read','draft:write','metadata:write'], expires: new Date(Date.now()+86400000) });
    token = created.token;
    key = await authenticate(`Bearer ${token}`, deps.lookup);
  },30000);
  afterAll(async () => { await pg.close(); });
  it('key list never returns hashes or tokens and expires invalid requests', async () => {
    const listed = JSON.stringify(await admin.list('owner'));
    expect(listed).not.toContain(token); expect(listed).not.toContain('secretHash');
    await expect(admin.issue({ owner: 'owner', name: 'bad', scopes: ['catalog:read'], expires: new Date(0) })).rejects.toThrow();
    await expect(admin.issue({ owner: 'missing', name: 'bad', scopes: ['catalog:read'], expires: new Date(Date.now()+86400000) })).rejects.toThrow();
  });
  it('reviews client sources without any search provider and applies only explicit fields', async () => {
    const id = randomUUID();
    await drafts.create({ request_id:id, kind:'manga_metadata', target:{ type:'manga',id:target }, proposal:{ title:'Reviewed' }, sources:[{ url:'https://publisher.example.org/book',confidence:0.8 }] }, key, randomUUID());
    const before = await get(id);
    expect(before.status).toBe('pending');
    await review.decide(id,before.review_token,'apply',key,randomUUID());
    expect((await pg.query('SELECT title,slug FROM manga WHERE id=$1',[target])).rows).toEqual([{title:'Reviewed',slug:'original'}]);
    expect((await pg.query('SELECT status,reviewer_user_id FROM mcp_metadata_drafts WHERE id=$1',[id])).rows).toEqual([{status:'applied',reviewer_user_id:'owner'}]);
  });
  it('applies only selected manga metadata fields and does not create an unselected category', async () => {
    const id = randomUUID(); const category = `Skipped ${randomUUID()}`; const title = `Selected ${randomUUID()}`;
    await drafts.create({ request_id:id, kind:'manga_metadata', target:{type:'manga',id:target}, proposal:{title,category_name:category,author_id:author}, sources:[{url:'https://publisher.example.org/book',confidence:0.8}] },key,randomUUID());
    const checked = await get(id);
    const result = await review.decide(id,checked.review_token,'apply',key,randomUUID(),{fields:['title']});
    expect(result).toMatchObject({applied_proposal:{title}});
    expect((await pg.query('SELECT title,author_id FROM manga WHERE id=$1',[target])).rows).toEqual([{title,author_id:null}]);
    expect((await pg.query('SELECT * FROM categories WHERE name=$1',[category])).rows).toHaveLength(0);
    expect((await pg.query<{decision_payload:unknown}>('SELECT decision_payload FROM mcp_metadata_drafts WHERE id=$1',[id])).rows[0].decision_payload).toEqual({title});
  });
  it('preserves existing tags and is idempotent across apply retries', async () => {
    const id = await makeTags(); const checked = await get(id);
    await review.decide(id,checked.review_token,'apply',key,randomUUID());
    expect(await review.decide(id,checked.review_token,'apply',key,randomUUID())).toMatchObject({already_completed:true});
    expect((await pg.query('SELECT * FROM manga_tags WHERE manga_id=$1',[target])).rows).toHaveLength(2);
    expect(invalidate).toHaveBeenCalled();
  });
  it('creates missing tags, reuses existing names case-insensitively and assigns both atomically', async () => {
    const createdName = `Created ${randomUUID()}`;
    const id = randomUUID();
    await drafts.create({ request_id: id, kind: 'manga_tags', target: { type: 'manga', id: target }, proposal: { tag_names: ['existing', createdName] }, sources: [] }, key, randomUUID());
    expect((await pg.query('SELECT * FROM tags WHERE name=$1',[createdName])).rows).toHaveLength(0);
    const checked = await review.get(id, key) as { review_token: string; current: { tag_catalog: { name: string }[] } };
    expect(checked.current.tag_catalog.map(tag => tag.name)).toEqual(['Existing']);
    await review.decide(id, checked.review_token, 'apply', key, randomUUID());
    expect((await pg.query('SELECT name FROM tags WHERE lower(name) IN (lower($1),lower($2)) ORDER BY name',[createdName,'Existing'])).rows).toEqual([{name:createdName},{name:'Existing'}]);
    expect((await pg.query('SELECT mt.* FROM manga_tags mt JOIN tags t ON t.id=mt.tag_id WHERE mt.manga_id=$1 AND t.name=$2',[target,createdName])).rows).toHaveLength(1);
  });
  it('creates and assigns only selected tags, records the subset, and binds retries to it', async () => {
    const skipped = `Skipped ${randomUUID()}`; const selected = `Selected ${randomUUID()}`; const id = randomUUID();
    await drafts.create({request_id:id,kind:'manga_tags',target:{type:'manga',id:target},proposal:{tag_names:[skipped,selected]},sources:[]},key,randomUUID());
    const checked = await get(id); const selection = {tag_names:[selected]};
    await expect(review.decide(id,checked.review_token,'apply',key,randomUUID(),{tag_names:[]})).rejects.toThrow('Select at least one tag');
    const result = await review.decide(id,checked.review_token,'apply',key,randomUUID(),selection);
    expect(result).toMatchObject({applied_proposal:{tag_names:[selected]}});
    expect(await review.get(id,key)).toMatchObject({status:'applied',applied_proposal:{tag_names:[selected]}});
    expect((await pg.query('SELECT name FROM tags WHERE name IN ($1,$2) ORDER BY name',[skipped,selected])).rows).toEqual([{name:selected}]);
    expect(await review.decide(id,checked.review_token,'apply',key,randomUUID(),selection)).toMatchObject({already_completed:true});
    await expect(review.decide(id,checked.review_token,'apply',key,randomUUID(),{tag_names:[skipped]})).rejects.toThrow('Decision conflict');
  });
  it('treats a tag created after review as stale instead of silently changing the approved effect', async () => {
    const name = `Raced ${randomUUID()}`; const id = randomUUID();
    await drafts.create({ request_id:id, kind:'manga_tags', target:{type:'manga',id:target}, proposal:{tag_names:[name]}, sources:[] }, key, randomUUID());
    const checked = await get(id);
    await pg.query('INSERT INTO tags(id,name) VALUES($1,$2)',[randomUUID(),name]);
    await expect(review.decide(id,checked.review_token,'apply',key,randomUUID())).rejects.toThrow('Stale review');
    expect((await get(id)).status).toBe('pending');
  });
  it('creates a missing category and assigns it atomically without a source', async () => {
    const name = `Category ${randomUUID()}`; const id = randomUUID();
    await drafts.create({ request_id:id, kind:'manga_metadata', target:{type:'manga',id:target}, proposal:{category_name:name}, sources:[] }, key, randomUUID());
    expect((await pg.query('SELECT * FROM categories WHERE name=$1',[name])).rows).toHaveLength(0);
    const checked = await review.get(id,key) as {review_token:string;current:{category:{name:string};category_catalog:null}};
    expect(checked.current).toMatchObject({category:{name:'MM'},category_catalog:null});
    await review.decide(id,checked.review_token,'apply',key,randomUUID());
    expect(await review.decide(id,checked.review_token,'apply',key,randomUUID())).toMatchObject({already_completed:true});
    expect((await pg.query('SELECT c.name FROM manga m JOIN categories c ON c.id=m.category_id WHERE m.id=$1',[target])).rows).toEqual([{name}]);
    expect((await pg.query('SELECT * FROM categories WHERE name=$1',[name])).rows).toHaveLength(1);
  });
  it('reuses an existing category case-insensitively instead of creating a duplicate', async () => {
    const id=randomUUID();
    await drafts.create({request_id:id,kind:'manga_metadata',target:{type:'manga',id:target},proposal:{category_name:'mm'},sources:[]},key,randomUUID());
    const checked=await review.get(id,key) as {review_token:string;current:{category_catalog:{name:string}}};
    expect(checked.current.category_catalog.name).toBe('MM');
    await review.decide(id,checked.review_token,'apply',key,randomUUID());
    expect((await pg.query("SELECT count(*)::int AS count FROM categories WHERE lower(name)='mm'")).rows).toEqual([{count:1}]);
    expect((await pg.query('SELECT category_id FROM manga WHERE id=$1',[target])).rows).toEqual([{category_id:existingCategory}]);
  });
  it('rejects a category review when another writer creates that category', async () => {
    const name=`Raced category ${randomUUID()}`; const id=randomUUID();
    await drafts.create({request_id:id,kind:'manga_metadata',target:{type:'manga',id:target},proposal:{category_name:name},sources:[]},key,randomUUID());
    const checked=await get(id);
    await pg.query('INSERT INTO categories(id,name) VALUES($1,$2)',[randomUUID(),name]);
    await expect(review.decide(id,checked.review_token,'apply',key,randomUUID())).rejects.toThrow('Stale review');
    expect((await get(id)).status).toBe('pending');
  });
  it('rolls back a new category and manga assignment when audit fails', async () => {
    const name=`Rollback category ${randomUUID()}`; const id=randomUUID();
    await drafts.create({request_id:id,kind:'manga_metadata',target:{type:'manga',id:target},proposal:{category_name:name},sources:[]},key,randomUUID());
    const checked=await get(id); const before=(await pg.query('SELECT category_id FROM manga WHERE id=$1',[target])).rows;
    await pg.exec("CREATE FUNCTION fail_category_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'offline'; END; $$; CREATE TRIGGER fail_category_audit BEFORE INSERT ON mcp_audit_events FOR EACH ROW EXECUTE FUNCTION fail_category_audit();");
    try { await expect(review.decide(id,checked.review_token,'apply',key,randomUUID())).rejects.toThrow(); }
    finally { await pg.exec('DROP TRIGGER fail_category_audit ON mcp_audit_events; DROP FUNCTION fail_category_audit();'); }
    expect((await pg.query('SELECT * FROM categories WHERE name=$1',[name])).rows).toHaveLength(0);
    expect((await pg.query('SELECT category_id FROM manga WHERE id=$1',[target])).rows).toEqual(before);
    expect((await get(id)).status).toBe('pending');
  });
  it('rejects stale reviews and leaves the draft pending', async () => {
    const id = await makeTags(); const checked = await get(id);
    await pg.query('UPDATE manga SET title=$2 WHERE id=$1',[target,'Changed by another editor']);
    await expect(review.decide(id,checked.review_token,'apply',key,randomUUID())).rejects.toThrow('Stale review');
    expect((await get(id)).status).toBe('pending');
  });
  it('rejects a review after its proposal changes', async () => {
    const id = await makeTags(); const checked = await get(id);
    await pg.query('UPDATE mcp_metadata_drafts SET payload=$2 WHERE id=$1',[id,JSON.stringify({tag_names:['Existing']})]);
    await expect(review.decide(id,checked.review_token,'apply',key,randomUUID())).rejects.toThrow('Stale review');
  });
  it('keeps draft and target unchanged when a uniqueness constraint fails', async () => {
    const another = randomUUID(); await pg.query('INSERT INTO manga(id,title,slug) VALUES($1,$2,$3)',[another,'Reserved title','reserved']);
    const id = randomUUID(); await drafts.create({request_id:id,kind:'manga_metadata',target:{type:'manga',id:target},proposal:{title:'Reserved title'},sources:[{url:'https://publisher.example.org/a',confidence:0.5}]},key,randomUUID());
    const before = (await pg.query('SELECT title FROM manga WHERE id=$1',[target])).rows;
    await expect(review.decide(id,(await get(id)).review_token,'apply',key,randomUUID())).rejects.toThrow();
    expect((await get(id)).status).toBe('pending');
    expect((await pg.query('SELECT title FROM manga WHERE id=$1',[target])).rows).toEqual(before);
  });
  it('rejects hidden targets and excludes them from pending lists', async () => {
    const id = await makeTags(); const checked = await get(id);
    await pg.query('UPDATE manga SET is_hidden=true WHERE id=$1',[target]);
    try {
      await expect(review.get(id,key)).rejects.toThrow();
      await expect(review.decide(id,checked.review_token,'apply',key,randomUUID())).rejects.toThrow();
      expect(await review.list(key)).toEqual([]);
    } finally { await pg.query('UPDATE manga SET is_hidden=false WHERE id=$1',[target]); }
  });
  it('scopes and owner boundaries protect review and mutation', async () => {
    const id = await makeTags(); const checked = await get(id);
    await expect(review.decide(id,checked.review_token,'apply',{...key,scopes:['catalog:read','draft:write']},randomUUID())).rejects.toThrow();
    const other = await admin.issue({owner:'other',name:'other',scopes:['catalog:read','metadata:write'],expires:new Date(Date.now()+86400000)});
    const otherKey = await authenticate(`Bearer ${other.token}`,deps.lookup);
    expect(await review.list(otherKey)).toEqual([]);
    await expect(review.get(id,otherKey)).rejects.toThrow('Draft unavailable');
  });
  it('rejects a draft without changing metadata, and prevents later apply', async () => {
    const id = await makeTags(); const checked = await get(id);
    const before = (await pg.query('SELECT * FROM manga_tags')).rows;
    await review.decide(id,checked.review_token,'reject',key,randomUUID());
    await expect(review.decide(id,checked.review_token,'apply',key,randomUUID())).rejects.toThrow();
    expect((await pg.query('SELECT * FROM manga_tags')).rows).toEqual(before);
  });
  it('rolls back target, draft status and audit together on audit failure', async () => {
    const id = randomUUID(); await drafts.create({request_id:id,kind:'manga_metadata',target:{type:'manga',id:target},proposal:{title:'Must roll back'},sources:[{url:'https://publisher.example.org/book',confidence:0.5}]},key,randomUUID());
    const checked = await get(id); const before = (await pg.query('SELECT title FROM manga WHERE id=$1',[target])).rows;
    await pg.exec("CREATE FUNCTION fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'offline'; END; $$; CREATE TRIGGER fail_audit BEFORE INSERT ON mcp_audit_events FOR EACH ROW EXECUTE FUNCTION fail_audit();");
    try { await expect(review.decide(id,checked.review_token,'apply',key,randomUUID())).rejects.toThrow(); }
    finally { await pg.exec('DROP TRIGGER fail_audit ON mcp_audit_events; DROP FUNCTION fail_audit();'); }
    expect((await pg.query('SELECT title FROM manga WHERE id=$1',[target])).rows).toEqual(before);
    expect((await get(id)).status).toBe('pending');
  });
  it('merges social URLs in the existing application format', async () => {
    const old = {url:'https://old.example.org/artist',label:'Original label',icon:'link'};
    await pg.query('UPDATE authors SET social_links=$2 WHERE id=$1',[author,JSON.stringify([old])]);
    const id = randomUUID(); await drafts.create({request_id:id,kind:'author_links',target:{type:'author',id:author},proposal:{social_links:['https://new.example.org/artist']},sources:[{url:'https://publisher.example.org/artist',confidence:0.5}]},key,randomUUID());
    await review.decide(id,(await get(id)).review_token,'apply',key,randomUUID());
    const row = (await pg.query<{social_links:string}>('SELECT social_links FROM authors WHERE id=$1',[author])).rows[0];
    expect(JSON.parse(row.social_links)).toEqual([old,{url:'https://new.example.org/artist',label:'artist',icon:'https://www.google.com/s2/favicons?domain=new.example.org&sz=128'}]);
  });
  it('applies only selected author links and leaves the proposed primary URL unchanged', async () => {
    const targetAuthor = randomUUID();
    await pg.query('INSERT INTO authors(id,name,profile_url,social_links) VALUES($1,$2,$3,$4)',[targetAuthor,'Partial links','https://old.example.org/profile','[]']);
    const first = {url:'https://social.example.org/first',label:'First',icon:'https://social.example.org/first.png'};
    const second = {url:'https://social.example.org/second',label:'Second',icon:'https://social.example.org/second.png'};
    const id = randomUUID();
    await drafts.create({request_id:id,kind:'author_links',target:{type:'author',id:targetAuthor},proposal:{profile_url:'https://new.example.org/profile',social_links:[first,second]},sources:[{url:'https://publisher.example.org/artist',confidence:0.8}]},key,randomUUID());
    const checked = await get(id);
    await review.decide(id,checked.review_token,'apply',key,randomUUID(),{social_link_urls:[second.url]});
    const row=(await pg.query<{profile_url:string;social_links:string}>('SELECT profile_url,social_links FROM authors WHERE id=$1',[targetAuthor])).rows[0];
    expect(row.profile_url).toBe('https://old.example.org/profile');
    expect(JSON.parse(row.social_links)).toEqual([second]);
  });
  it('requires explicit confirmation through MCP and completes a real protocol call', async () => {
    const id = await makeTags(); const checked = await get(id);
    const call = async (confirm?: boolean) => {
      const request = new Request('http://localhost/api/mcp',{method:'POST',headers:{authorization:`Bearer ${token}`,accept:'application/json, text/event-stream','content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'apply_metadata_draft',arguments:{draft_id:id,review_token:checked.review_token,...(confirm===undefined?{}:{confirm})}}})});
      return (await handleMcp(request,{...deps,review})).json();
    };
    expect((await call()).result.isError).toBe(true);
    expect((await get(id)).status).toBe('pending');
    expect((await call(true)).result.structuredContent.data.status).toBe('applied');
  });
  it('does not expose apply/reject to a read-and-draft key', async () => {
    const readKey = await admin.issue({owner:'owner',name:'reader',scopes:['catalog:read','draft:write'],expires:new Date(Date.now()+86400000)});
    const request = new Request('http://localhost/api/mcp',{method:'POST',headers:{authorization:`Bearer ${readKey.token}`,accept:'application/json, text/event-stream','content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/list'})});
    const result = await (await handleMcp(request,{...deps,review})).json();
    const names = result.result.tools.map((t:{name:string}) => t.name);
    expect(names).toContain('get_metadata_draft'); expect(names).not.toContain('apply_metadata_draft'); expect(names).not.toContain('reject_metadata_draft');
  });
  it('reports cache invalidation failure without claiming transaction failure', async () => {
    const id = await makeTags(); invalidate.mockRejectedValueOnce(new Error('cache unavailable'));
    const result = await review.decide(id,(await get(id)).review_token,'apply',key,randomUUID());
    expect(result).toMatchObject({status:'applied',cache_refresh_pending:true});
  });
  it('revoke is idempotent, owner-scoped and prevents subsequent decisions', async () => {
    const id = await makeTags(); const checked = await get(id);
    await expect(admin.revoke('other',key.id)).rejects.toThrow();
    const first = await admin.revoke('owner',key.id); expect(await admin.revoke('owner',key.id)).toEqual(first);
    await expect(authenticate(`Bearer ${token}`,deps.lookup)).rejects.toThrow();
    await expect(review.decide(id,checked.review_token,'apply',key,randomUUID())).rejects.toThrow();
  });
  it('allows a browser administrator to decide an existing draft without elevating its revoked key', async () => {
    const id = (await pg.query<{id:string}>("SELECT id FROM mcp_metadata_drafts WHERE status='pending' LIMIT 1")).rows[0].id;
    const browser = createBrowserReviewService(database, 'other', invalidate);
    const checked = await browser.get(id);
    const before = (await pg.query('SELECT * FROM manga_tags')).rows;
    const result = await browser.decide(id, checked.review_token, 'reject', randomUUID());
    expect(result.status).toBe('rejected');
    expect((await pg.query('SELECT * FROM manga_tags')).rows).toEqual(before);
    expect((await pg.query('SELECT reviewer_user_id FROM mcp_metadata_drafts WHERE id=$1',[id])).rows).toEqual([{reviewer_user_id:'other'}]);
    expect((await pg.query("SELECT owner_user_id FROM mcp_audit_events WHERE tool_name='admin_reject_metadata_draft'")).rows).toEqual([{owner_user_id:'other'}]);
    expect((await browser.decide(id, checked.review_token, 'reject', randomUUID())).already_completed).toBe(true);
  });
  it('browser decisions recheck bans/role and stale current data before any write', async () => {
    const id = (await pg.query<{id:string}>("SELECT id FROM mcp_metadata_drafts WHERE status='pending' AND target_type='manga' LIMIT 1")).rows[0].id;
    const browser = createBrowserReviewService(database, 'other');
    const checked = await browser.get(id);
    await pg.exec("UPDATE profiles SET is_banned=true WHERE id='other'");
    try { await expect(browser.decide(id, checked.review_token, 'apply', randomUUID())).rejects.toThrow('Access denied'); }
    finally { await pg.exec("UPDATE profiles SET is_banned=false WHERE id='other'"); }
    await pg.query('UPDATE manga SET title=$2 WHERE id=$1',[target,'Changed after browser review']);
    await expect(browser.decide(id, checked.review_token, 'apply', randomUUID())).rejects.toThrow('Stale review');
    await pg.exec("UPDATE profiles SET role='user' WHERE id='other'");
    try { await expect(browser.get(id)).rejects.toThrow('Access denied'); }
    finally { await pg.exec("UPDATE profiles SET role='admin' WHERE id='other'"); }
    expect((await browser.get(id)).status).toBe('pending');
  });
});

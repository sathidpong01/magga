import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { db } from '@/db';
import { createDraftService, draftInput } from '@/lib/mcp/drafts';
import { createBrowserReviewService, createReviewService } from '@/lib/mcp/review';

describe('new author proposals', () => {
  const pg = new PGlite();
  const database = drizzle(pg) as unknown as typeof db;
  const drafts = createDraftService(database);
  const review = createBrowserReviewService(database, 'admin');
  const key = { id: randomUUID(), ownerUserId: 'admin', name: 'client', scopes: ['catalog:read', 'draft:write'] };
  const sources = [{ url: 'https://example.org/artist', confidence: 0.9 }];
  async function make(name: string = randomUUID()) {
    const mangaId = randomUUID(), id = randomUUID();
    await pg.query('INSERT INTO manga(id,title) VALUES($1,$2)', [mangaId, 'Sample']);
    const input = { request_id: id, kind: 'manga_author' as const, target: { type: 'manga' as const, id: mangaId }, proposal: { name, social_links: ['https://example.org/artist', 'https://example.org/artist'] }, sources };
    await drafts.create(input, key, randomUUID());
    return { id, mangaId, input };
  }
  beforeAll(async () => {
    await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated;
      CREATE TABLE profiles(id text PRIMARY KEY, role text, is_banned boolean DEFAULT false, banned boolean DEFAULT false);
      INSERT INTO profiles(id,role) VALUES('admin','admin');
      CREATE TABLE authors(id uuid PRIMARY KEY, name text UNIQUE, profile_url text, social_links text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
      CREATE TABLE manga(id uuid PRIMARY KEY, title text, slug text, author_id uuid REFERENCES authors(id), category_id uuid, is_hidden boolean DEFAULT false, updated_at timestamptz DEFAULT now());
      CREATE TABLE tags(id uuid PRIMARY KEY,name text); CREATE TABLE manga_tags(manga_id uuid,tag_id uuid);`);
    await pg.exec(readFileSync('db/migrations/0008_mcp_access_and_drafts.sql', 'utf8'));
    await pg.exec(readFileSync('db/migrations/0009_mcp_new_author_drafts.sql', 'utf8'));
    await pg.exec(readFileSync('db/migrations/0010_mcp_partial_approval.sql', 'utf8'));
    await pg.query('INSERT INTO mcp_api_keys(id,owner_user_id,name,key_prefix,secret_hash,scopes,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7)', [key.id,'admin','client','prefix','a'.repeat(64),key.scopes,'2099-01-01']);
  }, 30000);
  afterAll(() => pg.close());
  it('creates only a draft, then atomically creates and assigns once on administrator approval', async () => {
    const d = await make('Meesh');
    expect(await drafts.create(d.input,key,randomUUID())).toMatchObject({draft_id:d.id,applied:false});
    expect((await pg.query('SELECT * FROM authors')).rows).toHaveLength(0);
    const r = await review.get(d.id);
    await expect(createReviewService(database).decide(d.id,r.review_token,'apply',key,randomUUID())).rejects.toThrow();
    expect(await review.decide(d.id,r.review_token,'apply',randomUUID())).toMatchObject({status:'applied'});
    expect(await review.decide(d.id,r.review_token,'apply',randomUUID())).toMatchObject({already_completed:true});
    const rows = (await pg.query('SELECT a.name,a.profile_url,a.social_links FROM authors a JOIN manga m ON m.author_id=a.id WHERE m.id=$1',[d.mangaId])).rows as {name:string;profile_url:null;social_links:string}[];
    expect(rows).toHaveLength(1); expect(rows[0].name).toBe('Meesh'); expect(rows[0].profile_url).toBeNull();
    expect(JSON.parse(rows[0].social_links)).toHaveLength(1);
    expect((await pg.query("SELECT * FROM mcp_audit_events WHERE tool_name='admin_apply_metadata_draft'")).rows).toHaveLength(1);
  });
  it('creates a new author with only the selected social channels', async () => {
    const d = await make('Partial author');
    const first = {url:'https://example.org/first',label:'First',icon:'https://example.org/first.png'};
    const second = {url:'https://example.org/second',label:'Second',icon:'https://example.org/second.png'};
    await pg.query('UPDATE mcp_metadata_drafts SET payload=$2 WHERE id=$1',[d.id,JSON.stringify({name:'Partial author',social_links:[first,second]})]);
    const checked = await review.get(d.id);
    await review.decide(d.id,checked.review_token,'apply',randomUUID(),{fields:['author'],social_link_urls:[second.url]});
    const [row]=(await pg.query<{name:string;social_links:string}>('SELECT a.name,a.social_links FROM authors a JOIN manga m ON m.author_id=a.id WHERE m.id=$1',[d.mangaId])).rows;
    expect(row.name).toBe('Partial author'); expect(JSON.parse(row.social_links)).toEqual([second]);
  });
  it('can approve the author assignment while declining every proposed social channel', async () => {
    const d = await make('Author without approved links'); const checked = await review.get(d.id);
    await review.decide(d.id,checked.review_token,'apply',randomUUID(),{fields:['author'],social_link_urls:[]});
    const [row]=(await pg.query<{social_links:string}>('SELECT a.social_links FROM authors a JOIN manga m ON m.author_id=a.id WHERE m.id=$1',[d.mangaId])).rows;
    expect(JSON.parse(row.social_links)).toEqual([]);
  });
  it('rejects without creating an author or assigning the manga', async () => {
    const d = await make('Rejected artist'); const r = await review.get(d.id);
    await review.decide(d.id,r.review_token,'reject',randomUUID());
    expect((await pg.query('SELECT author_id FROM manga WHERE id=$1',[d.mangaId])).rows).toEqual([{author_id:null}]);
    expect((await pg.query("SELECT * FROM authors WHERE name='Rejected artist'")).rows).toHaveLength(0);
  });
  it('refuses names that already exist regardless of case and outer whitespace', async () => {
    await expect(make('  MEESH ')).rejects.toThrow('Author already exists');
  });
  it('refuses an author created after the draft and still permits rejecting it', async () => {
    const d = await make('Race Artist'); const r = await review.get(d.id);
    await pg.query('INSERT INTO authors(id,name) VALUES($1,$2)',[randomUUID(),'race artist']);
    await expect(review.decide(d.id,r.review_token,'apply',randomUUID())).rejects.toThrow('Author already exists');
    expect((await review.get(d.id)).status).toBe('pending');
    await review.decide(d.id,(await review.get(d.id)).review_token,'reject',randomUUID());
  });
  it('never replaces an author assigned after creation, including after a fresh review', async () => {
    const d = await make('Unwanted author'); const r = await review.get(d.id);
    const [existing] = (await pg.query('SELECT id FROM authors LIMIT 1')).rows as {id:string}[];
    await pg.query('UPDATE manga SET author_id=$2 WHERE id=$1',[d.mangaId,existing.id]);
    await expect(review.decide(d.id,r.review_token,'apply',randomUUID())).rejects.toThrow('Stale review');
    await expect(review.decide(d.id,(await review.get(d.id)).review_token,'apply',randomUUID())).rejects.toThrow('Manga already has an author');
    await expect(drafts.create({...d.input,request_id:randomUUID()},key,randomUUID())).rejects.toThrow('Manga already has an author');
  });
  it('rolls back new author and manga assignment when audit persistence fails', async () => {
    const d = await make('Rolled back'); const r = await review.get(d.id);
    await pg.exec("ALTER TABLE mcp_audit_events ADD CONSTRAINT test_audit CHECK(tool_name <> 'admin_apply_metadata_draft') NOT VALID");
    try { await expect(review.decide(d.id,r.review_token,'apply',randomUUID())).rejects.toThrow(); }
    finally { await pg.exec('ALTER TABLE mcp_audit_events DROP CONSTRAINT test_audit'); }
    expect((await pg.query("SELECT * FROM authors WHERE name='Rolled back'")).rows).toHaveLength(0);
    expect((await pg.query('SELECT author_id FROM manga WHERE id=$1',[d.mangaId])).rows).toEqual([{author_id:null}]);
    expect((await review.get(d.id)).status).toBe('pending');
  });
  it('requires sources and valid public social URLs, and forbids extra writable fields', async () => {
    const d = await make('Validation');
    await expect(drafts.create({...d.input,request_id:randomUUID(),sources:[]},key,randomUUID())).rejects.toThrow('Sources required');
    await expect(drafts.create({...d.input,request_id:randomUUID(),proposal:{name:'Unsafe',social_links:['https://127.0.0.1/']}},key,randomUUID())).rejects.toThrow();
    expect(draftInput.safeParse({...d.input,proposal:{...d.input.proposal,profile_url:'https://example.org'}}).success).toBe(false);
    expect(draftInput.safeParse({...d.input,target:{type:'author',id:d.mangaId}}).success).toBe(false);
  });
  it('persists researched labels/icons on new authors', async () => {
    const d = await make('Enriched');
    const links = [{url:'https://example.org/enriched',label:'Artist display name',icon:'https://example.org/icon.png?size=32'}];
    await pg.query('UPDATE mcp_metadata_drafts SET payload=$2 WHERE id=$1',[d.id,JSON.stringify({name:'Enriched',social_links:links})]);
    await review.decide(d.id,(await review.get(d.id)).review_token,'apply',randomUUID());
    const [row] = (await pg.query("SELECT social_links FROM authors WHERE name='Enriched'")).rows as {social_links:string}[];
    expect(JSON.parse(row.social_links)).toEqual(links);
  });
  it('updates only explicit details of matching URLs, preserves other channels, and detects stale labels', async () => {
    const [author] = (await pg.query("SELECT id FROM authors WHERE name='Enriched'")).rows as {id:string}[];
    const other = {url:'https://example.org/keep',label:'Keep label',icon:'https://example.org/keep.png',custom:'preserved'};
    const original = {url:'https://example.org/enriched',label:'Old',icon:'https://example.org/old.png'};
    await pg.query('UPDATE authors SET social_links=$2 WHERE id=$1',[author.id,JSON.stringify([original,other])]);
    const id = randomUUID(), update = {...original,label:'New display name',icon:'https://example.org/new.png'};
    await drafts.create({request_id:id,kind:'author_links',target:{type:'author',id:author.id},proposal:{social_links:[update,other.url]},sources},key,randomUUID());
    const before = await review.get(id);
    expect(before.current).toMatchObject({social_link_details:[original,{url:other.url,label:other.label,icon:other.icon}]});
    expect(JSON.stringify(before.current)).not.toContain('custom');
    await pg.query('UPDATE authors SET social_links=$2 WHERE id=$1',[author.id,JSON.stringify([{...original,label:'Changed elsewhere'},other])]);
    await expect(review.decide(id,before.review_token,'apply',randomUUID())).rejects.toThrow('Stale review');
    await review.decide(id,(await review.get(id)).review_token,'apply',randomUUID());
    const [row] = (await pg.query('SELECT social_links,profile_url FROM authors WHERE id=$1',[author.id])).rows as {social_links:string;profile_url:null}[];
    expect(JSON.parse(row.social_links)).toEqual([update,other]); expect(row.profile_url).toBeNull();
  });
  it('rejects unsafe icons and malformed detail objects both before saving and at application', async () => {
    const d = await make('Invalid icon');
    for (const icon of ['javascript:alert(1)','data:image/svg+xml,test','https://127.0.0.1/icon','https://localhost/icon']) {
      await expect(drafts.create({...d.input,request_id:randomUUID(),proposal:{name:'Invalid icon',social_links:[{url:'https://example.org/artist',label:'Artist',icon}]}},key,randomUUID())).rejects.toThrow();
    }
    expect(draftInput.safeParse({...d.input,proposal:{name:'Bad',social_links:[{url:'https://example.org',label:'',icon:'https://example.org/icon'}]}}).success).toBe(false);
    await pg.query('UPDATE mcp_metadata_drafts SET payload=$2 WHERE id=$1',[d.id,JSON.stringify({name:'Invalid icon',social_links:[{url:'https://example.org/artist',label:'Artist',icon:'https://127.0.0.1/icon'}]})]);
    await expect(review.decide(d.id,(await review.get(d.id)).review_token,'apply',randomUUID())).rejects.toThrow();
    expect((await review.get(d.id)).status).toBe('pending');
  });
});

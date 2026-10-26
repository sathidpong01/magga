import { afterAll, describe, expect, it, mock } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { adminPageQuery, escapeLike } from "@/lib/admin-pagination";
import { NextRequest } from "next/server";
const client = new PGlite();
const database = drizzle(client);
mock.module("@/db", () => ({
  db: {
    select: database.select.bind(database),
    execute: async (query: Parameters<typeof database.execute>[0]) =>
      (await database.execute(query)).rows,
  },
}));
const { readAdminManga, readAdminUsers, readAdminOptions } =
  await import("@/lib/admin-lists");
const {readAdminSubmissions}=await import("@/lib/admin-submissions");
const { readAdminOverview } = await import("@/lib/admin-overview");
let freshSessionRead = false;
mock.module("@/lib/auth",()=>({auth:{api:{getSession:async(input:{query?:{disableCookieCache?:boolean}})=>{freshSessionRead=input.query?.disableCookieCache===true;return {user:{id:"admin",role:"admin"}};}}}}));
mock.module("next/headers",()=>({headers:async()=>new Headers()}));
const {GET:usersGET}=await import("@/app/api/admin/users/route");
await client.exec(`
CREATE TABLE authors(id uuid primary key,name text);
CREATE TABLE categories(id uuid primary key,name text);
CREATE TABLE tags(id uuid primary key,name text);
CREATE TABLE manga(id uuid primary key,title text,slug text,cover_image text,is_hidden boolean default false,view_count integer default 0,category_id uuid,author_id uuid,created_at timestamp default now());
CREATE TABLE manga_tags(manga_id uuid,tag_id uuid);
CREATE TABLE profiles(id text primary key,name text,email text,username text,image text,role text default 'user',banned boolean default false,is_banned boolean default false,ban_reason text,created_at timestamp default now());
CREATE TABLE comments(id uuid default gen_random_uuid(),user_id text);
CREATE TABLE manga_submissions(id uuid default gen_random_uuid(),user_id text,status text default 'PENDING',title text,slug text,description text,cover_image text,pages text,category_id uuid,author_id uuid,extra_metadata text,submitted_at timestamptz default now(),reviewed_at timestamptz,reviewed_by text,review_note text,rejection_reason text,approved_manga_id uuid,updated_at timestamptz default now());
CREATE SCHEMA private;
CREATE TABLE private.comment_reports(id uuid,status text);
CREATE TABLE mcp_metadata_drafts(id uuid,status text);
INSERT INTO authors SELECT gen_random_uuid(),'ผู้แต่ง '||i FROM generate_series(1,25)i;
INSERT INTO categories VALUES('10000000-0000-4000-8000-000000000001','หมวดทดสอบ');
INSERT INTO manga SELECT gen_random_uuid(),'ชื่อซ้ำ','work-'||i,'/test.svg',false,i,'10000000-0000-4000-8000-000000000001',null,'2026-01-01' FROM generate_series(1,205)i;
INSERT INTO manga(id,title,slug,cover_image,created_at) VALUES('10000000-0000-4000-8000-000000000002','เก่า_100%','old','/test.svg','2020-01-01');
INSERT INTO profiles(id,name,email) SELECT 'user-'||i,'ผู้ใช้ '||i,'user-'||i||'@example.invalid' FROM generate_series(1,25)i;
INSERT INTO comments(user_id) VALUES('user-1'),('user-1');
INSERT INTO manga_submissions(user_id) VALUES('user-1'),('user-1'),('user-1');
UPDATE manga_submissions SET title='ฝากลง';UPDATE profiles SET username='audituser1' WHERE id='user-1';
`);
afterAll(() => client.close());
describe("bounded admin SQL", () => {
  it("searches submissions by both title and owner without cross-scope alias errors",async()=>{
    for(const search of ["ฝากลง","audituser1"]){const result=await readAdminSubmissions({status:"ALL",page:1,limit:10,search});expect(result.items).toHaveLength(3);expect(result.total).toBe(3);}
  });
  it("offers bounded API pages while preserving the legacy array envelope",async()=>{
    const paged=await usersGET(new NextRequest("http://localhost/api/admin/users?paged=true"));
    expect(paged.headers.get("Cache-Control")).toBe("private, no-store");
    const page=await paged.json();expect(page.users).toHaveLength(20);expect(page.pagination.hasMore).toBe(true);
    const legacy=await(await usersGET(new NextRequest("http://localhost/api/admin/users"))).json();
    expect(Array.isArray(legacy)).toBe(true);expect(legacy).toHaveLength(25);expect(freshSessionRead).toBe(true);
  });
  it("finds old works outside the former 200-row window and treats LIKE metacharacters literally", async () => {
    const result = await readAdminManga(
      adminPageQuery({ search: "เก่า_100%" }),
    );
    expect(result.items.map((row) => row.slug)).toEqual(["old"]);
    expect(escapeLike("a_%")).toBe("a\\_\\%");
  });
  it("paginates stably when ordering values tie", async () => {
    const first = await readAdminManga(adminPageQuery()),
      second = await readAdminManga(adminPageQuery({ page: "2" }));
    expect(first.items.length).toBe(20);
    expect(first.hasMore).toBe(true);
    expect(
      new Set([...first.items, ...second.items].map((row) => row.id)).size,
    ).toBe(40);
    expect(
      (await readAdminManga(adminPageQuery({ limit: "50" }))).items,
    ).toHaveLength(50);
  });
  it("counts activity without multiplying the comment/submission relation", async () => {
    const result = await readAdminUsers(
      adminPageQuery({ search: "user-1@example.invalid" }),
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]._count).toEqual({ comments: 2, submissions: 3 });
    expect((await readAdminUsers(adminPageQuery())).items).toHaveLength(20);
  });
  it("keeps selected options outside the first page", async () => {
    const all = await client.query<{ id: string }>(
      "select id from authors order by name,id offset 24 limit 1",
    );
    const result = await readAdminOptions("authors", adminPageQuery(), [
      all.rows[0].id,
    ]);
    expect(result.items.some((row) => row.id === all.rows[0].id)).toBe(true);
    expect(result.items.length).toBeLessThanOrEqual(21);
  });
  it("returns scalar overview counts with a hard cap", async () => {
    await client.exec(
      "INSERT INTO comments(user_id) SELECT 'user-1' FROM generate_series(1,1005)",
    );
    const counts = await readAdminOverview();
    expect(counts.manga).toBe(206);
    expect(counts.comments).toBe(1000);
    expect(counts.pending).toBe(3);
  });
  it("bounds untrusted pagination input", () => {
    expect(adminPageQuery({ page: "Infinity", limit: "100000" })).toMatchObject(
      { page: 1, limit: 20 },
    );
    expect(adminPageQuery({ page: "999999999", limit: "50" })).toMatchObject({
      page: 10000,
      limit: 50,
    });
  });
});

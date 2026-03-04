/**
 * migrate-turso-to-supabase.ts
 *
 * วิธีใช้:
 *   npx tsx scripts/migrate-turso-to-supabase.ts
 *
 * Strategy: Generate UUID ใหม่สำหรับทุก record
 *            แล้ว map cuid เก่า → UUID ใหม่ ก่อน insert FK
 *
 * หมายเหตุ: User จาก Turso (NextAuth) จะถูก migrate เป็น record ใน profiles
 *           แต่ต้อง create ผ่าน Supabase Auth ใหม่เองแยกต่างหาก
 *           (better-auth จัดการ auth.users แยกจาก profiles)
 */

import { createClient } from "@libsql/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";
import { randomUUID } from "crypto";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const rawUrl = process.env.POSTGRES_PRISMA_URL || "";
const connectionString = rawUrl.split("?")[0];
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const prisma = new PrismaClient({ adapter });

// ID mapping: cuid → UUID
const idMap = new Map<string, string>();
function mapId(oldId: string | null | undefined): string | null {
  if (!oldId) return null;
  if (!idMap.has(oldId)) idMap.set(oldId, randomUUID());
  return idMap.get(oldId)!;
}
function requireId(oldId: string): string {
  return mapId(oldId)!;
}

async function fetchAll<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  const result = await turso.execute(sql);
  return result.rows.map((row) => {
    const obj: Record<string, unknown> = {};
    result.columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj as T;
  });
}

function log(msg: string) {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  const n = Number(val);
  if (!isNaN(n) && n > 0) return new Date(n > 1e10 ? n : n * 1000);
  return new Date(val as string);
}

async function main() {
  log("🚀 เริ่ม Migration: Turso → Supabase");
  log("   (ใช้ UUID mapping สำหรับทุก record)");

  // ============================================================
  // PRE-PASS: สร้าง UUID สำหรับทุก id ก่อน (เพื่อ FK consistency)
  // ============================================================
  log("🔑 Pre-generating UUID mappings...");
  const allTables = [
    'SELECT id FROM "Category"',
    'SELECT id FROM "Author"',
    'SELECT id FROM "Tag"',
    'SELECT id FROM "Manga"',
    'SELECT id FROM "User"',
    'SELECT id FROM "MangaRating"',
    'SELECT id FROM "MangaSubmission"',
    'SELECT id FROM "MangaSubmissionTag"',
    'SELECT id FROM "Advertisement"',
    'SELECT id FROM "Comment"',
    'SELECT id FROM "CommentVote"',
  ];
  for (const sql of allTables) {
    const rows = await fetchAll<{ id: string }>(sql);
    rows.forEach(r => mapId(r.id));
  }
  log(`   ✅ Pre-mapped ${idMap.size} IDs`);

  // ============================================================
  // 1. Category
  // ============================================================
  log("📦 migrating: Category");
  const categories = await fetchAll<{ id: string; name: string }>('SELECT * FROM "Category"');
  for (const c of categories) {
    await prisma.category.upsert({
      where: { id: requireId(c.id) },
      create: { id: requireId(c.id), name: c.name },
      update: { name: c.name },
    });
  }
  log(`   ✅ ${categories.length} categories`);

  // ============================================================
  // 2. Author
  // ============================================================
  log("📦 migrating: Author");
  const authors = await fetchAll<Record<string, unknown>>('SELECT * FROM "Author"');
  for (const a of authors) {
    await prisma.author.upsert({
      where: { id: requireId(a.id as string) },
      create: {
        id: requireId(a.id as string),
        name: a.name as string,
        profileUrl: (a.profileUrl as string) ?? null,
        socialLinks: (a.socialLinks as string) ?? null,
      },
      update: { name: a.name as string },
    });
  }
  log(`   ✅ ${authors.length} authors`);

  // ============================================================
  // 3. Tag
  // ============================================================
  log("📦 migrating: Tag");
  const tags = await fetchAll<{ id: string; name: string }>('SELECT * FROM "Tag"');
  for (const t of tags) {
    await prisma.tag.upsert({
      where: { id: requireId(t.id) },
      create: { id: requireId(t.id), name: t.name },
      update: { name: t.name },
    });
  }
  log(`   ✅ ${tags.length} tags`);

  // ============================================================
  // 4. Manga
  // ============================================================
  log("📦 migrating: Manga");
  const mangas = await fetchAll<Record<string, unknown>>('SELECT * FROM "Manga"');
  for (const m of mangas) {
    await prisma.manga.upsert({
      where: { id: requireId(m.id as string) },
      create: {
        id: requireId(m.id as string),
        slug: (m.slug as string) ?? requireId(m.id as string),
        title: m.title as string,
        description: (m.description as string) ?? null,
        coverImage: m.coverImage as string,
        coverWidth: m.coverWidth != null ? Number(m.coverWidth) : null,
        coverHeight: m.coverHeight != null ? Number(m.coverHeight) : null,
        pages: m.pages as string,
        authorName: (m.authorName as string) ?? null,
        extraMetadata: (m.extraMetadata as string) ?? null,
        isHidden: Boolean(Number(m.isHidden ?? 0)),
        viewCount: Number(m.viewCount ?? 0),
        ratingSum: Number(m.ratingSum ?? 0),
        ratingCount: Number(m.ratingCount ?? 0),
        averageRating: Number(m.averageRating ?? 0),
        categoryId: mapId(m.categoryId as string),
        authorId: mapId(m.authorId as string),
      },
      update: {
        title: m.title as string,
        isHidden: Boolean(Number(m.isHidden ?? 0)),
        viewCount: Number(m.viewCount ?? 0),
      },
    });
  }
  log(`   ✅ ${mangas.length} manga`);

  // ============================================================
  // 5. Manga ↔ Tag (_MangaToTag: A=mangaId, B=tagId)
  // ============================================================
  log("📦 migrating: _MangaToTag");
  const mangaTags = await fetchAll<{ A: string; B: string }>('SELECT A, B FROM "_MangaToTag"');
  for (const mt of mangaTags) {
    try {
      await prisma.manga.update({
        where: { id: requireId(mt.A) },
        data: { tags: { connect: { id: requireId(mt.B) } } },
      });
    } catch { /* skip */ }
  }
  log(`   ✅ ${mangaTags.length} manga_tags`);

  // ============================================================
  // 6. User → profiles
  // หมายเหตุ: User จาก Turso (NextAuth) จะถูก migrate เป็น profiles record
  //           แต่ Better Auth จัดการ auth.users แยก → ต้องสร้าง user ใน auth แยก
  //           ดังนั้น migrate เฉพาะ profiles table (ไม่ผ่าน auth.users FK)
  // ============================================================
  log("📦 migrating: User → profiles (direct SQL, bypass auth.users FK)");
  const users = await fetchAll<Record<string, unknown>>('SELECT * FROM "User"');
  for (const u of users) {
    const newId = requireId(u.id as string);
    try {
      // ใช้ raw SQL เพราะ profiles FK → auth.users อาจบล็อก
      await pool.query(
        `INSERT INTO public.profiles (id, name, email, email_verified, image, username, password, role, is_banned, ban_reason, banned_at, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())
         ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, role=EXCLUDED.role`,
        [
          newId,
          (u.name as string) ?? null,
          (u.email as string) ?? null,
          toDate(u.emailVerified),
          (u.image as string) ?? null,
          (u.username as string) ?? null,
          (u.password as string) ?? null,
          (u.role as string) ?? "user",
          Boolean(Number(u.isBanned ?? 0)),
          (u.banReason as string) ?? null,
          toDate(u.bannedAt),
        ]
      );
    } catch (e) {
      console.warn(`   ⚠️ skip user ${u.id}:`, (e as Error).message);
    }
  }
  log(`   ✅ ${users.length} users`);

  // ============================================================
  // 7. MangaRating
  // ============================================================
  log("📦 migrating: MangaRating");
  const ratings = await fetchAll<Record<string, unknown>>('SELECT * FROM "MangaRating"');
  for (const r of ratings) {
    try {
      await prisma.mangaRating.upsert({
        where: { id: requireId(r.id as string) },
        create: {
          id: requireId(r.id as string),
          mangaId: requireId(r.mangaId as string),
          fingerprint: r.fingerprint as string,
          ipAddress: (r.ipAddress as string) ?? null,
          rating: Number(r.rating),
        },
        update: { rating: Number(r.rating) },
      });
    } catch { /* skip */ }
  }
  log(`   ✅ ${ratings.length} manga_ratings`);

  // ============================================================
  // 8. LoginAttempt
  // ============================================================
  log("📦 migrating: LoginAttempt");
  const attempts = await fetchAll<Record<string, unknown>>('SELECT * FROM "LoginAttempt"');
  for (const a of attempts) {
    await prisma.loginAttempt.upsert({
      where: { identifier: a.identifier as string },
      create: { identifier: a.identifier as string, count: Number(a.count ?? 0), expiresAt: toDate(a.expiresAt) ?? new Date() },
      update: { count: Number(a.count ?? 0), expiresAt: toDate(a.expiresAt) ?? new Date() },
    });
  }
  log(`   ✅ ${attempts.length} login_attempts`);

  // ============================================================
  // 9. SystemConfig
  // ============================================================
  log("📦 migrating: SystemConfig");
  const configs = await fetchAll<{ key: string; value: string; description?: string }>('SELECT * FROM "SystemConfig"');
  for (const c of configs) {
    await prisma.systemConfig.upsert({
      where: { key: c.key },
      create: { key: c.key, value: c.value, description: c.description ?? null },
      update: { value: c.value },
    });
  }
  log(`   ✅ ${configs.length} system_config`);

  // ============================================================
  // 10. MangaSubmission
  // ============================================================
  log("📦 migrating: MangaSubmission");
  const submissions = await fetchAll<Record<string, unknown>>('SELECT * FROM "MangaSubmission"');
  for (const s of submissions) {
    try {
      await prisma.mangaSubmission.upsert({
        where: { id: requireId(s.id as string) },
        create: {
          id: requireId(s.id as string),
          userId: requireId(s.userId as string),
          title: s.title as string,
          slug: (s.slug as string) ?? null,
          description: (s.description as string) ?? null,
          coverImage: s.coverImage as string,
          pages: s.pages as string,
          categoryId: mapId(s.categoryId as string),
          authorId: mapId(s.authorId as string),
          extraMetadata: (s.extraMetadata as string) ?? null,
          status: (s.status as string) ?? "PENDING",
          submittedAt: toDate(s.submittedAt) ?? new Date(),
          reviewedAt: toDate(s.reviewedAt),
          reviewedBy: (s.reviewedBy as string) ?? null,
          reviewNote: (s.reviewNote as string) ?? null,
          rejectionReason: (s.rejectionReason as string) ?? null,
          approvedMangaId: mapId(s.approvedMangaId as string),
        },
        update: { status: s.status as string },
      });
    } catch (e) {
      console.warn(`   ⚠️ skip submission ${s.id}:`, (e as Error).message);
    }
  }
  log(`   ✅ ${submissions.length} manga_submissions`);

  // ============================================================
  // 11. MangaSubmissionTag
  // ============================================================
  log("📦 migrating: MangaSubmissionTag");
  const subTags = await fetchAll<Record<string, unknown>>('SELECT * FROM "MangaSubmissionTag"');
  for (const st of subTags) {
    try {
      await prisma.mangaSubmissionTag.upsert({
        where: { submissionId_tagId: { submissionId: requireId(st.submissionId as string), tagId: requireId(st.tagId as string) } },
        create: { id: requireId(st.id as string), submissionId: requireId(st.submissionId as string), tagId: requireId(st.tagId as string) },
        update: {},
      });
    } catch { /* skip */ }
  }
  log(`   ✅ ${subTags.length} manga_submission_tags`);

  // ============================================================
  // 12. Advertisement
  // ============================================================
  log("📦 migrating: Advertisement");
  const ads = await fetchAll<Record<string, unknown>>('SELECT * FROM "Advertisement"');
  for (const a of ads) {
    await prisma.advertisement.upsert({
      where: { id: requireId(a.id as string) },
      create: {
        id: requireId(a.id as string),
        type: a.type as string,
        title: a.title as string,
        imageUrl: a.imageUrl as string,
        linkUrl: (a.linkUrl as string) ?? null,
        content: (a.content as string) ?? null,
        placement: a.placement as string,
        repeatCount: Number(a.repeatCount ?? 1),
        isActive: Boolean(Number(a.isActive ?? 1)),
      },
      update: { isActive: Boolean(Number(a.isActive ?? 1)) },
    });
  }
  log(`   ✅ ${ads.length} advertisements`);

  // ============================================================
  // 13. Comment (parent ก่อน)
  // ============================================================
  log("📦 migrating: Comment");
  const comments = await fetchAll<Record<string, unknown>>(
    'SELECT * FROM "Comment" ORDER BY parentId ASC NULLS FIRST'
  );
  for (const c of comments) {
    try {
      await prisma.comment.upsert({
        where: { id: requireId(c.id as string) },
        create: {
          id: requireId(c.id as string),
          content: c.content as string,
          imageUrl: (c.imageUrl as string) ?? null,
          mangaId: requireId(c.mangaId as string),
          userId: requireId(c.userId as string),
          imageIndex: c.imageIndex != null ? Number(c.imageIndex) : null,
          parentId: mapId(c.parentId as string),
          voteScore: Number(c.voteScore ?? 0),
        },
        update: { voteScore: Number(c.voteScore ?? 0) },
      });
    } catch (e) {
      console.warn(`   ⚠️ skip comment ${c.id}:`, (e as Error).message);
    }
  }
  log(`   ✅ ${comments.length} comments`);

  // ============================================================
  // 14. CommentVote
  // ============================================================
  log("📦 migrating: CommentVote");
  const votes = await fetchAll<Record<string, unknown>>('SELECT * FROM "CommentVote"');
  for (const v of votes) {
    try {
      await prisma.commentVote.upsert({
        where: { commentId_userId: { commentId: requireId(v.commentId as string), userId: requireId(v.userId as string) } },
        create: { id: requireId(v.id as string), value: Number(v.value), commentId: requireId(v.commentId as string), userId: requireId(v.userId as string) },
        update: { value: Number(v.value) },
      });
    } catch { /* skip */ }
  }
  log(`   ✅ ${votes.length} comment_votes`);

  log("\n🎉 Migration เสร็จสมบูรณ์!");
  log("⚠️  หมายเหตุ: User accounts ถูก migrate เป็น profiles");
  log("   แต่ต้องให้ user login/register ใหม่ผ่าน Better Auth");
  log("   เพราะ passwords ใช้ hash format ต่างกัน (NextAuth vs Better Auth)");

  await prisma.$disconnect();
  await pool.end();
  turso.close();
}

main().catch((err) => {
  console.error("❌ Migration ล้มเหลว:", err);
  process.exit(1);
});

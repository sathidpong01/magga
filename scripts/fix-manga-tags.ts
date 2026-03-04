/**
 * fix-manga-tags.ts
 * Insert manga_tags โดยใช้ POSTGRES_URL_NON_POOLING (service role / direct connection)
 * ซึ่ง bypass RLS ทำให้ insert ได้
 *
 * รัน: npx tsx scripts/fix-manga-tags.ts
 */

import { createClient } from "@libsql/client";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";
import { randomUUID } from "crypto";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// ใช้ NON_POOLING = direct connection ที่ bypass RLS
const directUrl = (process.env.POSTGRES_URL_NON_POOLING || "").split("?")[0];
const pool = new Pool({ connectionString: directUrl, ssl: { rejectUnauthorized: false } });

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function fetchAll<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  const result = await turso.execute(sql);
  return result.rows.map((row) => {
    const obj: Record<string, unknown> = {};
    result.columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj as T;
  });
}

async function main() {
  console.log("🔧 Fix manga_tags: ดึง ID mapping จาก Supabase...");

  // ดึง manga ทั้งหมดจาก Turso พร้อม title เพื่อ match กับ Supabase
  const tursoManga = await fetchAll<{ id: string; title: string }>('SELECT id, title FROM "Manga"');
  const tursoTags = await fetchAll<{ id: string; name: string }>('SELECT id, name FROM "Tag"');
  const tursoLinks = await fetchAll<{ A: string; B: string }>('SELECT A, B FROM "_MangaToTag"');

  // ดึง manga จาก Supabase เพื่อ build title → uuid map
  const supabaseManga = await pool.query<{ id: string; title: string }>("SELECT id, title FROM manga");
  const supabaseTags = await pool.query<{ id: string; name: string }>("SELECT id, name FROM tags");

  // Build mapping: turso cuid → supabase uuid (via title/name matching)
  const mangaMap = new Map<string, string>(); // turso_cuid → supabase_uuid
  const tagMap = new Map<string, string>();

  for (const tm of tursoManga) {
    const found = supabaseManga.rows.find(r => r.title === tm.title);
    if (found) mangaMap.set(tm.id, found.id);
  }
  for (const tt of tursoTags) {
    const found = supabaseTags.rows.find(r => r.name === tt.name);
    if (found) tagMap.set(tt.id, found.id);
  }

  console.log(`   Manga mapped: ${mangaMap.size}/${tursoManga.length}`);
  console.log(`   Tags mapped:  ${tagMap.size}/${tursoTags.length}`);
  console.log(`   Links to insert: ${tursoLinks.length}`);

  // Insert manga_tags
  let inserted = 0;
  let skipped = 0;
  for (const link of tursoLinks) {
    const mangaId = mangaMap.get(link.A);
    const tagId = tagMap.get(link.B);
    if (!mangaId || !tagId) { skipped++; continue; }
    try {
      await pool.query(
        `INSERT INTO manga_tags (manga_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [mangaId, tagId]
      );
      inserted++;
    } catch (e) {
      console.warn(`   ⚠️ skip ${link.A}→${link.B}:`, (e as Error).message);
      skipped++;
    }
  }

  console.log(`\n✅ Inserted ${inserted} manga_tags, skipped ${skipped}`);

  // Verify
  const count = await pool.query("SELECT COUNT(*) FROM manga_tags");
  console.log(`📊 Total manga_tags in Supabase: ${count.rows[0].count}`);

  await pool.end();
  turso.close();
}

main().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});

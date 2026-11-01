import { createHash } from "node:crypto";
import { and, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { mangaUploads, manga, mangaSubmissions } from "@/db/schema";
import { ASSET_POLICIES } from "./policies";
import type { StorageAdapter } from "./types";

type UploadQueries = Pick<PgDatabase<PgQueryResultHKT>, "insert" | "select" | "update" | "execute">;
type UploadDatabase = { transaction<T>(run: (tx: UploadQueries) => Promise<T>): Promise<T> };
const DRAFT_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export class MangaUploadError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export async function storeMangaUpload(database: UploadDatabase, storage: StorageAdapter, input: {
  userId: string; uploadId: string; file: File;
}) {
  let processed;
  try {
    processed = await ASSET_POLICIES["manga-page"].process(input.file, { kind: "manga-page", mangaId: "drafts" });
  } catch {
    throw new MangaUploadError("รูปภาพไม่ถูกต้อง เสียหาย หรือมีขนาดภาพเกินกำหนด", 400);
  }
  const contentHash = createHash("sha256").update(processed.data).digest("hex");
  const identity = and(eq(mangaUploads.userId, input.userId), eq(mangaUploads.uploadId, input.uploadId));
  const expiresAt = new Date(Date.now() + DRAFT_LIFETIME_MS);
  // Commit ownership before touching storage; a crash always leaves a cleanup record.
  await database.transaction(async tx => {
    await tx.insert(mangaUploads).values({
      userId: input.userId, uploadId: input.uploadId, objectKey: processed.key,
      url: storage.getPublicUrl(processed.key), contentHash, contentType: processed.contentType,
      bytes: processed.data.byteLength, width: processed.width || 0, height: processed.height || 0, expiresAt,
    }).onConflictDoNothing({ target: [mangaUploads.userId, mangaUploads.uploadId] });
  });
  return database.transaction(async tx => {
    const [asset] = await tx.select().from(mangaUploads).where(identity).for("update");
    if (!asset || asset.state === "retired") throw new MangaUploadError("ไฟล์หมดอายุแล้ว กรุณาเลือกไฟล์ใหม่", 410);
    if (asset.contentHash !== contentHash || asset.contentType !== processed.contentType)
      throw new MangaUploadError("รหัสอัปโหลดนี้ใช้กับไฟล์อื่นแล้ว กรุณาเลือกไฟล์ใหม่", 409);
    if (asset.state === "pending") {
      // The row lock serializes retries and cleanup while the same immutable bytes are written.
      await tx.execute(sql`SET LOCAL idle_in_transaction_session_timeout = '60s'`);
      await storage.put(asset.objectKey, processed.data, processed.contentType);
    }
    await tx.update(mangaUploads).set({ state: "ready", expiresAt }).where(identity);
    return { url: asset.url, width: asset.width, height: asset.height };
  });
}

function referenced(url: SQL | string) {
  return sql<boolean>`EXISTS (
    SELECT 1 FROM ${manga} WHERE ${manga.coverImage} = ${url}
      OR ${manga.pages} @> jsonb_build_array(${url}::text)
      OR ${manga.pages} @> jsonb_build_array(jsonb_build_object('url', ${url}::text))
    UNION ALL
    SELECT 1 FROM ${mangaSubmissions} WHERE ${mangaSubmissions.coverImage} = ${url}
      OR ${mangaSubmissions.pages}::jsonb @> jsonb_build_array(${url}::text)
      OR ${mangaSubmissions.pages}::jsonb @> jsonb_build_array(jsonb_build_object('url', ${url}::text))
  )`;
}

export async function cleanupMangaUploads(database: UploadDatabase, storage: StorageAdapter) {
  const assets = await database.transaction(async tx => {
    const candidates = await tx.select({ key: mangaUploads.objectKey }).from(mangaUploads).where(and(
      isNull(mangaUploads.removedAt), lt(mangaUploads.expiresAt, new Date()),
      sql`NOT ${referenced(sql`${mangaUploads.url}`)}`,
    )).orderBy(mangaUploads.objectKey).limit(100).for("update", { skipLocked: true });
    if (!candidates.length) return [];
    // Recheck references with a fresh snapshot after acquiring the same locks as savers.
    return tx.update(mangaUploads).set({ state: "retired" }).where(and(
      inArray(mangaUploads.objectKey, candidates.map(asset => asset.key)),
      sql`NOT ${referenced(sql`${mangaUploads.url}`)}`,
    )).returning({ key: mangaUploads.objectKey });
  });
  if (!assets.length) return 0;
  const keys = assets.map(asset => asset.key);
  // Retired tombstones prevent resurrection; failed/partial deletions remain retryable.
  await storage.delete(keys);
  await database.transaction(async tx => {
    await tx.update(mangaUploads).set({ removedAt: new Date() }).where(inArray(mangaUploads.objectKey, keys));
  });
  return assets.length;
}

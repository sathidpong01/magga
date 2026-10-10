import { randomUUID } from "node:crypto";
import { and, eq, gt, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { commentAssets, commentRateLimits, commentGuestSessions, comments, manga } from "@/db/schema";
import { getCommentPrivateStorage } from "@/lib/storage/comment-private";
import { processCommentImage } from "./image-processing";
import { resolveCommentActor, resolveGuestActor, type CommentActor } from "./identity";
import { CommentError, ForbiddenCommentError, NotFoundCommentError, ValidationCommentError } from "./types";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
const assetOwner = (actor: CommentActor) => actor.kind === "member" ? eq(commentAssets.userId, actor.userId) : eq(commentAssets.guestId, actor.guestId);

export async function createCommentAsset(actor: CommentActor, file: File) {
  const storage = getCommentPrivateStorage();
  const id = randomUUID();
  const objectKey = `comments/${id}.webp`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${actor.kind === "member" ? actor.userId : actor.guestId},0))`);
    const [{ count }] = await tx.select({ count: sql<number>`count(*)::int` }).from(commentAssets).where(and(assetOwner(actor), inArray(commentAssets.state, ["staged", "reserved"]), gt(commentAssets.expiresAt, new Date())));
    if (count >= 3) throw new CommentError("คุณมีรูปที่ยังไม่ได้ส่ง 3 รูปแล้ว กรุณาส่งความคิดเห็นหรือรอให้รูปหมดอายุ", 429);
    // Reserved uploads cannot be attached or publicly read until storage succeeds.
    await tx.insert(commentAssets).values({ id, userId: actor.kind === "member" ? actor.userId : null, guestId: actor.kind === "guest" ? actor.guestId : null, objectKey, contentType: "image/webp", bytes: 1, width: 1, height: 1, state: "reserved", expiresAt });
  });
  try {
    const image = await processCommentImage(file);
    await db.transaction(async tx => {
      const [asset] = await tx.select().from(commentAssets).where(and(eq(commentAssets.id,id),assetOwner(actor),eq(commentAssets.state,"reserved"),isNull(commentAssets.commentId))).for("update");
      if (!asset || asset.expiresAt.getTime() <= Date.now()) throw new ValidationCommentError("รูปหมดอายุหรือถูกลบแล้ว กรุณาอัปโหลดใหม่");
      // Hold the row until storage and staging commit, so cleanup/account removal
      // cannot delete its tracking metadata and race a later orphaning upload.
      await storage.put(asset.objectKey, image.data, image.contentType);
      await tx.update(commentAssets).set({ state: "staged", bytes: image.bytes, width: image.width, height: image.height, updatedAt: new Date() }).where(eq(commentAssets.id,id));
    });
    return { assetId: id, width: image.width, height: image.height, bytes: image.bytes, contentType: image.contentType };
  } catch (error) {
    await db.update(commentAssets).set({ state: "deleted", expiresAt: new Date(), updatedAt: new Date() }).where(eq(commentAssets.id, id));
    try { await storage.delete(objectKey); } catch { /* Retained metadata lets scheduled cleanup retry. */ }
    throw error;
  }
}

export async function reserveCommentAsset(tx: Transaction, actor: CommentActor, assetId: string, _commentId: string) {
  const [asset] = await tx.select().from(commentAssets).where(and(eq(commentAssets.id, assetId), assetOwner(actor))).for("update");
  if (!asset || asset.state !== "staged" || asset.expiresAt.getTime() <= Date.now()) throw new ValidationCommentError("รูปหมดอายุ ถูกใช้ไปแล้ว หรือไม่ได้เป็นของคุณ กรุณาอัปโหลดใหม่");
  await tx.update(commentAssets).set({ state: "reserved", updatedAt: new Date() }).where(eq(commentAssets.id, asset.id));
}

export async function finalizeCommentAsset(tx: Transaction, assetId: string, commentId: string, status: string = "published") {
  const [asset] = await tx.select().from(commentAssets).where(and(eq(commentAssets.id, assetId), eq(commentAssets.state, "reserved"))).for("update");
  if (!asset) throw new ValidationCommentError("รูปไม่พร้อมสำหรับความคิดเห็นนี้");
  const imageUrl = status === "published" ? await getCommentPrivateStorage().publish(asset.objectKey) : null;
  await tx.update(commentAssets).set({ state: "published", commentId, updatedAt: new Date() }).where(eq(commentAssets.id, assetId));
  return imageUrl;
}

/** Call with the comment already locked. A failed R2 delete aborts the mutation. */
export async function rollbackCommentAssetPublication(assetId: string) {
  await db.transaction(async tx => {
    const [asset] = await tx.select().from(commentAssets).where(and(eq(commentAssets.id,assetId),isNull(commentAssets.commentId),inArray(commentAssets.state,["staged","reserved"]))).for("update");
    // A concurrent successful attachment owns its public object and must be preserved.
    if (asset) await getCommentPrivateStorage().unpublish(asset.objectKey);
  });
}

export async function retireCommentAssets(tx: Transaction, commentId: string) {
  const assets = await tx.select().from(commentAssets).where(eq(commentAssets.commentId, commentId)).orderBy(commentAssets.id).for("update");
  if (!assets.length) return [];
  await tx.update(commentAssets).set({ state: "deleted", expiresAt: new Date(), updatedAt: new Date() }).where(inArray(commentAssets.id, assets.map(asset => asset.id)));
  return assets.map(asset => asset.id);
}

/** Business mutations commit the retirement ledger first. Failed object deletes
 * stay queued for the existing cleanup cron; a DB rollback never deletes files. */
export async function purgeRetiredCommentAssets(ids: string[]) {
  if (!ids.length) return true;
  try {
    for (const id of [...new Set(ids)]) await db.transaction(async tx => {
      const [asset] = await tx.select().from(commentAssets).where(and(eq(commentAssets.id, id), eq(commentAssets.state, "deleted"))).for("update");
      if (!asset) return;
      await getCommentPrivateStorage().delete(asset.objectKey);
      await tx.delete(commentAssets).where(eq(commentAssets.id, id));
    });
    return true;
  } catch {
    console.error("Comment object cleanup pending; retirement ledger retained");
    return false;
  }
}

/** Only call after authorizing every row for an owner/admin response. */
export async function decorateCommentImagePreviews<T extends { id: string; status: string; imageUrl: string | null }>(rows: T[]): Promise<T[]> {
  const privateRows = rows.filter(row => !["published", "deleted"].includes(row.status));
  if (!privateRows.length) return rows;
  const assets = await db.select().from(commentAssets).where(and(inArray(commentAssets.commentId, privateRows.map(row => row.id)), eq(commentAssets.state, "published")));
  const previews = new Map<string, string>();
  const storage = assets.length ? getCommentPrivateStorage() : null;
  for (const asset of assets) if (asset.commentId && storage) previews.set(asset.commentId, await storage.previewUrl(asset.objectKey));
  return rows.map(row => privateRows.some(item => item.id === row.id) ? { ...row, imageUrl: previews.get(row.id) ?? null } : row);
}

/** After commit only: public copies remain intact; failed private deletion stays tracked. */
export async function discardPublishedCommentStaging(commentId: string) {
  await db.transaction(async tx => {
    const [comment] = await tx.select({status:comments.status,imageUrl:comments.imageUrl}).from(comments).where(eq(comments.id,commentId)).for("update");
    if (comment?.status !== "published" || !comment.imageUrl || comment.imageUrl.startsWith("/api/")) return;
    const assets = await tx.select().from(commentAssets).where(and(eq(commentAssets.commentId,commentId),eq(commentAssets.state,"published"))).orderBy(commentAssets.id).for("update");
    if (!assets.length) return;
    const storage = getCommentPrivateStorage();
    for (const asset of assets) {
      if (comment.imageUrl !== storage.publicUrl(asset.objectKey)) continue;
      await storage.discardStaging(asset.objectKey);
      await tx.update(commentAssets).set({updatedAt:new Date()}).where(eq(commentAssets.id,asset.id));
    }
  });
}

export async function readPublishedCommentAsset(assetId: string, headers = new Headers()) {
  const [asset] = await db.select({ asset: commentAssets, comment: comments, hidden: manga.isHidden, parentVisible: sql<boolean>`(${comments.parentId} IS NULL OR EXISTS (SELECT 1 FROM public.comments parent WHERE parent.id = ${comments.parentId} AND parent.status IN ('published','deleted')))` }).from(commentAssets).innerJoin(comments, eq(commentAssets.commentId, comments.id)).innerJoin(manga, eq(comments.mangaId, manga.id)).where(eq(commentAssets.id, assetId)).limit(1);
  if (!asset || asset.asset.state !== "published" || asset.comment.status === "deleted") throw new NotFoundCommentError();
  const visible = asset.asset.state === "published" && asset.comment.status === "published" && !asset.hidden && asset.parentVisible;
  if (!visible) {
    const actor = await resolveCommentActor(headers);
    let guest = null;
    if (actor?.kind === "member" && actor.role !== "admin" && asset.comment.userId !== actor.userId) {
      try { guest = await resolveGuestActor(headers); }
      catch (error) { if (!(error instanceof ForbiddenCommentError)) throw error; }
    }
    const owner = actor?.kind === "member" ? asset.comment.userId === actor.userId || !!guest && asset.comment.guestId === guest.guestId : actor?.kind === "guest" && asset.comment.guestId === actor.guestId;
    const admin = actor?.kind === "member" && actor.role === "admin";
    if (!admin && !(owner && asset.comment.status === "pending" && !asset.hidden && asset.parentVisible && asset.asset.state === "published")) throw new NotFoundCommentError();
  }
  const storage = getCommentPrivateStorage();
  return visible ? storage.publicUrl(asset.asset.objectKey) : storage.previewUrl(asset.asset.objectKey);
}

/** Deletes only tracked expired uploads; never follows arbitrary user URLs. */
export async function cleanupCommentAssets() {
  const storage = getCommentPrivateStorage();
  const eligible = () => and(or(inArray(commentAssets.state, ["staged", "reserved", "deleted"]), and(eq(commentAssets.state, "published"), isNull(commentAssets.commentId))), lt(commentAssets.expiresAt, new Date()));
  const candidates = await db.select({ id: commentAssets.id, commentId: commentAssets.commentId }).from(commentAssets).where(eligible()).limit(100);
  let deleted = 0;
  for (const candidate of candidates) {
    await db.transaction(async tx => {
      // Match moderation's comment -> asset lock order. Publishing cannot race a purge.
      const [comment] = candidate.commentId ? await tx.select({ status: comments.status }).from(comments).where(eq(comments.id, candidate.commentId)).for("update") : [];
      const [asset] = await tx.select().from(commentAssets).where(and(eq(commentAssets.id, candidate.id), eligible())).for("update");
      if (!asset) return;
      if (asset.commentId) {
        if (asset.commentId !== candidate.commentId || asset.state !== "deleted" || comment?.status !== "deleted") return;
      }
      await storage.delete(asset.objectKey);
      await tx.delete(commentAssets).where(eq(commentAssets.id, asset.id));
      deleted++;
    });
  }
  // Rotate oldest attached rows after success so each bounded sweep makes progress.
  const published = await db.select({commentId:commentAssets.commentId}).from(commentAssets).innerJoin(comments,eq(commentAssets.commentId,comments.id)).where(and(eq(commentAssets.state,"published"),eq(comments.status,"published"),sql`${comments.imageUrl} LIKE 'https://%'`)).orderBy(commentAssets.updatedAt,commentAssets.id).limit(100);
  let stagingError: unknown;
  for (const commentId of new Set(published.flatMap(asset=>asset.commentId ? [asset.commentId] : []))) {
    try { await discardPublishedCommentStaging(commentId); }
    catch (error) { stagingError ??= error; }
  }
  if (stagingError) throw stagingError;
  await db.delete(commentRateLimits).where(lt(commentRateLimits.expiresAt, new Date()));
  // Session expiry removes only the credential, preserving the author and conversation.
  await db.delete(commentGuestSessions).where(lt(commentGuestSessions.expiresAt, new Date()));
  return { deleted };
}

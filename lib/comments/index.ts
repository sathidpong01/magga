import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { randomUUID, createHash } from "node:crypto";
import { eq, and, isNull, desc, asc, sql, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { comments, commentVotes, manga, profiles, commentGuests } from "@/db/schema";
import { requireCommentActor, resolveCommentActor, resolveGuestActor, assertCommentOrigin, ensureGuestVerification, type CommentActor } from "./identity";
import { consumeCommentLimit } from "./abuse";
import { assertGuestCommentsEnabled } from "./config";
import { reserveCommentAsset, finalizeCommentAsset, retireCommentAssets, decorateCommentImagePreviews, rollbackCommentAssetPublication, discardPublishedCommentStaging } from "./assets";
import { requireUuid, validateCommentContent, validateImageIndex } from "./validation";
import { CommentError, ForbiddenCommentError, NotFoundCommentError, ValidationCommentError, type CallerInput, type CreateCommentInput, type UpdateCommentInput, type VoteCommentInput, type ListCommentsOptions, type CommentListResult } from "./types";
import { parseCompositeCommentCursor, getNextCommentCursor } from "./pagination";
export * from "./types";
export * from "./pagination";

function callerHeaders(input: CallerInput): Headers {
  if (input instanceof Request) return input.headers;
  if (input instanceof Headers) return input;
  if (typeof input === "object" && input !== null && "user" in input) throw new ForbiddenCommentError("ต้องตรวจตัวตนจากคำขอ");
  return new Headers(input as HeadersInit);
}
export function isCommentOwner(actor: CommentActor, row: {userId:string|null;guestId:string|null}) {
  return actor.kind === "member" ? row.userId === actor.userId : row.guestId === actor.guestId;
}
async function resolveMemberGuest(headers: Headers) {
  try {
    return await resolveGuestActor(headers);
  } catch (error) {
    // A denied secondary guest identity supplies no rights to an authenticated member.
    // Infrastructure failures still abort the request rather than hiding an incomplete check.
    if (error instanceof ForbiddenCommentError) return null;
    throw error;
  }
}
async function visibleManga(mangaId: string, actor?: CommentActor|null, imageIndex?: number|null) {
  requireUuid(mangaId,"mangaId");
  const [work] = await db.select({id:manga.id,slug:manga.slug,isHidden:manga.isHidden,pages:manga.pages}).from(manga).where(eq(manga.id,mangaId)).limit(1);
  if (!work || (work.isHidden && !(actor?.kind === "member" && actor.role === "admin"))) throw new NotFoundCommentError("ไม่พบเรื่องนี้");
  if (imageIndex !== undefined && imageIndex !== null && (!Array.isArray(work.pages) || imageIndex>=work.pages.length)) throw new ValidationCommentError("หน้าการ์ตูนไม่ถูกต้อง");
  return work;
}
async function writeActor(input: CallerInput) {
  const headers = callerHeaders(input);
  assertCommentOrigin(headers);
  return {headers,actor:await requireCommentActor(headers)};
}
export function handleCommentError(error: unknown): NextResponse {
  if (error instanceof CommentError) return NextResponse.json({error:error.message,code:error.code},{status:error.status,headers:{"Cache-Control":"private, no-store"}});
  if (error instanceof SyntaxError) return NextResponse.json({error:"ข้อมูลไม่ถูกต้อง"},{status:400});
  console.error("Comment request failed",error instanceof Error ? error.name : "unknown");
  return NextResponse.json({error:"ระบบไม่พร้อม กรุณาลองใหม่"},{status:503,headers:{"Cache-Control":"private, no-store"}});
}
async function readPublicRows(ids: string[]) {
  if (!ids.length) return [];
  const rows = await db.select({comment:comments,profile:{id:profiles.id,name:profiles.name,username:profiles.username,image:profiles.image},guest:{name:commentGuests.name,publicCode:commentGuests.publicCode}}).from(comments).leftJoin(profiles,eq(comments.userId,profiles.id)).leftJoin(commentGuests,eq(comments.guestId,commentGuests.id)).where(inArray(comments.id,ids));
  return rows.map(({comment:c,profile:p,guest:g}) => {
    const removed = c.status === "deleted";
    return {id:c.id,content:removed ? "ความคิดเห็นถูกลบแล้ว" : c.content,imageUrl:removed ? null : c.imageUrl,voteScore:c.voteScore,createdAt:c.createdAt,updatedAt:c.updatedAt,mangaId:c.mangaId,imageIndex:c.imageIndex,parentId:c.parentId,status:c.status,user:c.userId ? p : null,author:c.guestId ? {kind:"guest" as const,name:c.authorName || g?.name || "ผู้เยี่ยมชม",publicCode:c.guestPublicCode || g?.publicCode || undefined,image:null} : {kind:"member" as const,name:p?.name || p?.username || "สมาชิก",username:p?.username,image:p?.image || null},replies:[],repliesNextCursor:null as string|null};
  });
}
export async function createComment(caller: CallerInput, input: CreateCommentInput) {
  const {headers,actor} = await writeActor(caller);
  assertGuestCommentsEnabled(actor);
  const mangaId = requireUuid(input.mangaId,"mangaId");
  const assetId = input.assetId ? requireUuid(input.assetId,"assetId") : null;
  if (input.imageUrl) throw new ValidationCommentError("กรุณาอัปโหลดรูปใหม่");
  const content = validateCommentContent(input.content,!!assetId);
  const imageIndex = validateImageIndex(input.imageIndex);
  const parentId = input.parentId ? requireUuid(input.parentId,"parentId") : null;
  const idempotencyKey = requireUuid(input.idempotencyKey,"idempotencyKey");
  const owner = actor.kind === "member" ? eq(comments.userId,actor.userId) : eq(comments.guestId,actor.guestId);
  const requestHash = createHash("sha256").update(JSON.stringify({mangaId,assetId,content,imageIndex,parentId})).digest("hex");
  const work = await visibleManga(mangaId,actor,imageIndex);
  let reservedAsset = false;
  const resultId = await db.transaction(async tx => {
    // All requests by one owner serialize before replay, spam and asset checks.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${actor.kind === "member" ? actor.userId : actor.guestId},0))`);
    const [existing] = await tx.select().from(comments).where(and(owner,eq(comments.idempotencyKey,idempotencyKey))).limit(1);
    if (existing) {
      if (existing.requestHash !== requestHash) throw new ValidationCommentError("รหัสคำขอนี้ถูกใช้กับความคิดเห็นอื่นแล้ว");
      return existing.id;
    }
    await ensureGuestVerification(actor,headers,input.challengeToken,tx);
    await consumeCommentLimit(actor,headers,"comment",0,tx);
    if (parentId) {
      const [parent] = await tx.select().from(comments).where(eq(comments.id,parentId)).limit(1);
      if (!parent || parent.mangaId !== mangaId || parent.imageIndex !== imageIndex || parent.parentId || parent.status !== "published") throw new ValidationCommentError("ไม่สามารถตอบกลับความคิดเห็นนี้ได้");
    }
    const [duplicate] = await tx.select({id:comments.id}).from(comments).where(and(owner,eq(comments.content,content),eq(comments.mangaId,mangaId),sql`${comments.createdAt}>now()-interval '2 minutes'`)).limit(1);
    if (content && duplicate) throw new ValidationCommentError("คุณส่งข้อความนี้แล้ว กรุณารอสักครู่");
    const id = randomUUID();
    if (assetId) { await reserveCommentAsset(tx,actor,assetId,id); reservedAsset = true; }
    await tx.insert(comments).values({id,mangaId,content,imageIndex,parentId,userId:actor.kind === "member" ? actor.userId : null,guestId:actor.kind === "guest" ? actor.guestId : null,authorName:actor.name,guestPublicCode:actor.kind === "guest" ? actor.publicCode : null,imageUrl:null,idempotencyKey,requestHash,status:"published"});
    if (assetId) {
      const imageUrl = await finalizeCommentAsset(tx,assetId,id,"published");
      await tx.update(comments).set({imageUrl}).where(eq(comments.id,id));
    }
    return id;
  }).catch(async error => {
    if (assetId && reservedAsset) {
      try { await rollbackCommentAssetPublication(assetId); }
      catch { /* Exact staged key remains tracked for scheduled cleanup to retry. */ }
    }
    throw error;
  });
  if (assetId && reservedAsset) {
    try { await discardPublishedCommentStaging(resultId); }
    catch { /* Creation committed; scheduled cleanup retries the tracked private key. */ }
  }
  revalidatePath(`/${work.slug}`);
  return (await readPublicRows([resultId]))[0];
}
export async function updateComment(caller: CallerInput,input: UpdateCommentInput) {
  const {headers,actor} = await writeActor(caller);
  const id = requireUuid(input.commentId,"commentId");
  const [row] = await db.select().from(comments).where(eq(comments.id,id)).limit(1);
  if (!row) throw new NotFoundCommentError();
  const work = await visibleManga(row.mangaId,actor);
  const guest = actor.kind === "member" ? await resolveMemberGuest(headers) : null;
  if (!(isCommentOwner(actor,row) || guest && isCommentOwner(guest,row)) || row.status !== "published") throw new ForbiddenCommentError("แก้ไขได้เฉพาะความคิดเห็นของคุณที่เผยแพร่แล้ว");
  const content = validateCommentContent(input.content,!!row.imageUrl);
  await consumeCommentLimit(actor,headers,"comment");
  await db.transaction(async tx => {
    const [current] = await tx.select().from(comments).where(eq(comments.id,id)).for("update");
    if (!current || current.status !== "published" || !(isCommentOwner(actor,current) || guest && isCommentOwner(guest,current))) throw new ForbiddenCommentError();
    await tx.update(comments).set({content,status:"published",updatedAt:new Date().toISOString()}).where(eq(comments.id,id));
  });
  revalidatePath(`/${work.slug}`);
  return (await readPublicRows([id]))[0];
}
export async function deleteComment(caller: CallerInput,commentId:string) {
  const {headers,actor} = await writeActor(caller);
  requireUuid(commentId,"commentId");
  const [row] = await db.select().from(comments).where(eq(comments.id,commentId)).limit(1);
  if (!row) throw new NotFoundCommentError();
  const work = await visibleManga(row.mangaId,actor);
  const guest = actor.kind === "member" ? await resolveMemberGuest(headers) : null;
  if (!isCommentOwner(actor,row) && !(guest && isCommentOwner(guest,row)) && !(actor.kind === "member" && actor.role === "admin")) throw new ForbiddenCommentError();
  await consumeCommentLimit(actor,headers,"comment");
  await db.transaction(async tx => {
    await tx.select({id:comments.id}).from(comments).where(eq(comments.id,commentId)).for("update");
    await tx.update(comments).set({status:"deleted",content:"",imageUrl:null,updatedAt:new Date().toISOString()}).where(eq(comments.id,commentId));
    await retireCommentAssets(tx,commentId);
  });
  revalidatePath(`/${work.slug}`);
  return {success:true};
}
export async function voteComment(caller: CallerInput,input: VoteCommentInput) {
  const {headers,actor} = await writeActor(caller);
  if (actor.kind !== "member") throw new ForbiddenCommentError("กรุณาเข้าสู่ระบบก่อนโหวต");
  const id = requireUuid(input.commentId,"commentId");
  if (input.value !== 1 && input.value !== -1) throw new ValidationCommentError("คะแนนไม่ถูกต้อง");
  await consumeCommentLimit(actor,headers,"vote");
  const result = await db.transaction(async tx => {
    const [row] = await tx.select().from(comments).where(eq(comments.id,id)).for("update");
    if (!row || row.status !== "published") throw new NotFoundCommentError();
    const [work] = await tx.select({isHidden:manga.isHidden}).from(manga).where(eq(manga.id,row.mangaId));
    if (!work || work.isHidden && actor.role !== "admin") throw new NotFoundCommentError();
    const [old] = await tx.select().from(commentVotes).where(and(eq(commentVotes.commentId,id),eq(commentVotes.userId,actor.userId)));
    const userVote = old?.value === input.value ? null : input.value;
    if (old) await tx.delete(commentVotes).where(eq(commentVotes.id,old.id));
    if (userVote) await tx.insert(commentVotes).values({commentId:id,userId:actor.userId,value:userVote});
    const voteScore = row.voteScore-(old?.value || 0)+(userVote || 0);
    await tx.update(comments).set({voteScore}).where(eq(comments.id,id));
    return {voteScore,userVote};
  });
  return result;
}
export async function listComments(options: ListCommentsOptions):Promise<CommentListResult> {
  const imageIndex = validateImageIndex(options.imageIndex);
  await visibleManga(options.mangaId,null,imageIndex);
  const limit = options.limit ?? 20;
  if (!Number.isSafeInteger(limit) || limit<1 || limit>50) throw new ValidationCommentError("จำนวนความคิดเห็นไม่ถูกต้อง");
  const conditions = [eq(comments.mangaId,options.mangaId),isNull(comments.parentId),inArray(comments.status,["published","deleted"]),imageIndex === null ? isNull(comments.imageIndex) : eq(comments.imageIndex,imageIndex)];
  if (options.cursor) {
    const parsed = parseCompositeCommentCursor(options.cursor);
    if (!parsed) throw new ValidationCommentError("cursor ไม่ถูกต้อง");
    const timestamp = options.cursor.split("|")[0];
    conditions.push(parsed.id ? sql`(${comments.createdAt},${comments.id})<(${timestamp}::timestamptz,${parsed.id}::uuid)` : sql`${comments.createdAt}<${timestamp}::timestamptz`);
  }
  const roots = await db.select().from(comments).where(and(...conditions)).orderBy(desc(comments.createdAt),desc(comments.id)).limit(limit+1);
  const hasNext = roots.length>limit;
  if (hasNext) roots.pop();
  const items = await readPublicRows(roots.map(row=>row.id));
  const ordered = roots.map(row=>items.find(item=>item.id===row.id)!);
  if (ordered.length) {
    const ranked = db.select({id:comments.id,parentId:comments.parentId,rank:sql<number>`row_number() over (partition by ${comments.parentId} order by ${comments.createdAt} asc, ${comments.id} asc)`.as("reply_rank")}).from(comments).where(and(eq(comments.mangaId,options.mangaId),imageIndex === null ? isNull(comments.imageIndex) : eq(comments.imageIndex,imageIndex),inArray(comments.parentId,ordered.map(c=>c.id)),inArray(comments.status,["published","deleted"]))).as("ranked_replies");
    const replies = await db.select({id:ranked.id,parentId:ranked.parentId,rank:ranked.rank}).from(ranked).where(sql`${ranked.rank}<=21`).orderBy(asc(ranked.rank));
    const publicReplies = await readPublicRows(replies.map(row=>row.id));
    const replyById = new Map(publicReplies.map(reply=>[reply.id,reply]));
    for (const root of ordered) {
      const group = replies.filter(row=>row.parentId === root.id);
      const visibleReplies = group.slice(0,20).map(row=>replyById.get(row.id)!);
      root.replies = visibleReplies as never[];
      const lastReply = visibleReplies.at(-1);
      root.repliesNextCursor = group.length>20 && lastReply ? getNextCommentCursor(lastReply.createdAt,lastReply.id) : null;
    }
  }
  const last = roots.at(-1);
  return {comments:ordered,nextCursor:hasNext && last ? getNextCommentCursor(last.createdAt,last.id) : null};
}
export async function listCommentReplies(options:{commentId:string;cursor?:string|null;limit?:number}):Promise<CommentListResult> {
  const commentId = requireUuid(options.commentId,"commentId");
  const limit = options.limit ?? 20;
  if (!Number.isSafeInteger(limit) || limit<1 || limit>50) throw new ValidationCommentError("จำนวนความคิดเห็นไม่ถูกต้อง");
  const [parent] = await db.select().from(comments).where(eq(comments.id,commentId)).limit(1);
  if (!parent || parent.parentId || !["published","deleted"].includes(parent.status)) throw new NotFoundCommentError();
  await visibleManga(parent.mangaId,null,parent.imageIndex);
  const conditions = [eq(comments.parentId,commentId),eq(comments.mangaId,parent.mangaId),parent.imageIndex === null ? isNull(comments.imageIndex) : eq(comments.imageIndex,parent.imageIndex),inArray(comments.status,["published","deleted"])];
  if (options.cursor) {
    const parsed = parseCompositeCommentCursor(options.cursor);
    if (!parsed) throw new ValidationCommentError("cursor ไม่ถูกต้อง");
    const timestamp = options.cursor.split("|")[0];
    conditions.push(parsed.id ? sql`(${comments.createdAt},${comments.id})>(${timestamp}::timestamptz,${parsed.id}::uuid)` : sql`${comments.createdAt}>${timestamp}::timestamptz`);
  }
  const rows = await db.select().from(comments).where(and(...conditions)).orderBy(asc(comments.createdAt),asc(comments.id)).limit(limit+1);
  const hasNext = rows.length>limit;
  if (hasNext) rows.pop();
  const items = await readPublicRows(rows.map(row=>row.id));
  const byId = new Map(items.map(item=>[item.id,item]));
  const last = rows.at(-1);
  return {comments:rows.map(row=>byId.get(row.id)!),nextCursor:hasNext && last ? getNextCommentCursor(last.createdAt,last.id) : null};
}
export async function getCommentCapabilities(headers:Headers,ids:string[],scope?:{mangaId:string;imageIndex:number|null}) {
  if (ids.length>100) throw new ValidationCommentError("ขอข้อมูลมากเกินไป");
  ids.forEach(id=>requireUuid(id,"id"));
  const actor = await resolveCommentActor(headers);
  const guest = actor?.kind === "member" ? await resolveMemberGuest(headers) : null;
  const rows = ids.length ? await db.select().from(comments).innerJoin(manga,eq(comments.mangaId,manga.id)).where(and(inArray(comments.id,ids),eq(manga.isHidden,false))) : [];
  const votes = actor?.kind === "member" && ids.length ? await db.select().from(commentVotes).where(and(eq(commentVotes.userId,actor.userId),inArray(commentVotes.commentId,ids))) : [];
  const capabilities = Object.fromEntries(rows.map(({comments:c})=>[c.id,{canEdit:!!actor && (isCommentOwner(actor,c) || !!guest && isCommentOwner(guest,c)) && c.status === "published",canDelete:!!actor && (isCommentOwner(actor,c) || !!guest && isCommentOwner(guest,c) || actor.kind === "member" && actor.role === "admin") && c.status !== "deleted",userVote:votes.find(v=>v.commentId===c.id)?.value ?? null}]));
  let ownComments = [] as Awaited<ReturnType<typeof readPublicRows>>;
  if (actor && scope) {
    await visibleManga(scope.mangaId,null,validateImageIndex(scope.imageIndex));
    const owner = actor.kind === "member" ? guest ? or(eq(comments.userId,actor.userId),eq(comments.guestId,guest.guestId)) : eq(comments.userId,actor.userId) : eq(comments.guestId,actor.guestId);
    const own = await db.select({id:comments.id}).from(comments).where(and(owner,eq(comments.mangaId,scope.mangaId),scope.imageIndex === null ? isNull(comments.imageIndex) : eq(comments.imageIndex,scope.imageIndex),eq(comments.status,"pending"))).orderBy(desc(comments.createdAt)).limit(50);
    ownComments = await decorateCommentImagePreviews(await readPublicRows(own.map(c=>c.id)));
  }
  return {capabilities,comments:ownComments};
}

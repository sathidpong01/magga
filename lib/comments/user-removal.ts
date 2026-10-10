import { purgeRetiredCommentAssets } from "./assets";
import { randomBytes } from "node:crypto";
import { eq, inArray, or, sql, asc } from "drizzle-orm";
import { db } from "@/db";
import { profiles, comments, commentVotes, commentGuests, commentAssets, commentReports, commentModerationEvents } from "@/db/schema";
import { NotFoundCommentError, ValidationCommentError } from "./types";

/** Preserves other authors' replies while removing the member and their private references. */
export async function deleteUserPreservingComments(userId: string) {
  if (typeof userId !== "string" || !userId || userId.length>128) throw new ValidationCommentError("Invalid user ID");
  const retired: string[] = [];
  const result = await db.transaction(async tx => {
    // The profile lock also prevents new foreign-key references appearing during removal.
    const [user] = await tx.select({id:profiles.id}).from(profiles).where(eq(profiles.id,userId)).for("update");
    if (!user) throw new NotFoundCommentError("User not found");
    const votedComments = await tx.select({commentId:commentVotes.commentId}).from(commentVotes).where(eq(commentVotes.userId,userId));
    const affected = votedComments.length ? or(eq(comments.userId,userId),inArray(comments.id,votedComments.map(vote=>vote.commentId))) : eq(comments.userId,userId);
    const lockedComments = await tx.select({id:comments.id,userId:comments.userId}).from(comments).where(affected).orderBy(asc(comments.id)).for("update");
    const ownedComments = lockedComments.filter(comment=>comment.userId === userId);
    // Re-read after the comment locks, then remove only this account's contribution to each score.
    await tx.execute(sql`UPDATE ${comments} AS target SET vote_score=target.vote_score-removed.score
      FROM (SELECT ${commentVotes.commentId} AS comment_id,sum(${commentVotes.value}) AS score
        FROM ${commentVotes} WHERE ${commentVotes.userId}=${userId} GROUP BY ${commentVotes.commentId}) AS removed
      WHERE target.id=removed.comment_id`);
    const ownedAssets = await tx.select({id:commentAssets.id,objectKey:commentAssets.objectKey}).from(commentAssets).where(eq(commentAssets.userId,userId)).orderBy(commentAssets.id).for("update");
    if (ownedComments.length || ownedAssets.length) {
      // No session is issued for this banned tombstone; its code contains no original account identifier.
      const [tombstone] = await tx.insert(commentGuests).values({name:"ผู้ใช้ที่ถูกลบ",publicCode:`DELETED-${randomBytes(12).toString("hex")}`,isBanned:true,banReason:"Account removed"}).returning({id:commentGuests.id});
      await tx.update(comments).set({userId:null,guestId:tombstone.id,authorName:"ผู้ใช้ที่ถูกลบ",guestPublicCode:null,content:"",imageUrl:null,status:"deleted",idempotencyKey:null,requestHash:null,updatedAt:new Date().toISOString()}).where(eq(comments.userId,userId));
      if (ownedAssets.length) {
        retired.push(...ownedAssets.map(asset => asset.id));
        await tx.update(commentAssets).set({ userId: null, guestId: tombstone.id, state: "deleted", expiresAt: new Date(), updatedAt: new Date() }).where(inArray(commentAssets.id, retired));
      }
    }
    const ownedReports = await tx.select({id:commentReports.id}).from(commentReports).where(eq(commentReports.userId,userId)).for("update");
    const eventCondition = ownedReports.length ? or(eq(commentModerationEvents.actorUserId,userId),inArray(commentModerationEvents.reportId,ownedReports.map(report=>report.id))) : eq(commentModerationEvents.actorUserId,userId);
    await tx.delete(commentModerationEvents).where(eventCondition);
    await tx.delete(commentReports).where(eq(commentReports.userId,userId));
    await tx.update(commentReports).set({reviewerUserId:null,updatedAt:new Date()}).where(eq(commentReports.reviewerUserId,userId));
    await tx.delete(profiles).where(eq(profiles.id,userId));
    return {success:true};
  });
  await purgeRetiredCommentAssets(retired);
  return result;
}

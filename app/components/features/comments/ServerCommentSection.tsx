import { db } from "@/db";
import { comments as commentsTable } from "@/db/schema";
import { and, eq, isNull, inArray, count } from "drizzle-orm";
import { listComments } from "@/lib/comments";
import type { CommentItem } from "@/lib/comments/types";
import type { PublicComment } from "./CommentList";
import CommentInteractions from "./CommentInteractions";
interface ServerCommentSectionProps {
  mangaId: string;
  imageIndex?: number | null;
  title?: string;
}
function serializeComment(comment: CommentItem): PublicComment {
  return {
    id: comment.id,
    content: comment.content,
    imageUrl: comment.imageUrl,
    voteScore: comment.voteScore,
    createdAt:
      typeof comment.createdAt === "string"
        ? comment.createdAt
        : comment.createdAt.toISOString(),
    status: comment.status,
    parentId: comment.parentId,
    author: comment.author || {
      kind: "member",
      name: comment.user?.name || "ผู้ใช้",
      image: comment.user?.image,
      username: comment.user?.username,
    },
    user: comment.user,
    replies: comment.replies?.map(serializeComment),
    repliesNextCursor: comment.repliesNextCursor,
  };
}
/** Only the public comment DTO crosses the server/client boundary. */
export default async function ServerCommentSection({
  mangaId,
  imageIndex = null,
  title = "ความคิดเห็น",
}: ServerCommentSectionProps) {
  const result = await listComments({ mangaId, imageIndex, limit: 20 });
  const [{ count: totalCount }] = await db
    .select({ count: count() })
    .from(commentsTable)
    .where(
      and(
        eq(commentsTable.mangaId, mangaId),
        imageIndex !== null
          ? eq(commentsTable.imageIndex, imageIndex)
          : isNull(commentsTable.imageIndex),
        isNull(commentsTable.parentId),
        inArray(commentsTable.status, ["published", "deleted"]),
      ),
    );
  return (
    <CommentInteractions
      mangaId={mangaId}
      imageIndex={imageIndex}
      initialComments={result.comments.map(serializeComment)}
      initialNextCursor={result.nextCursor}
      initialTotal={totalCount}
      initialHasMore={Boolean(result.nextCursor)}
      title={title}
    />
  );
}

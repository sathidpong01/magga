import { db } from "@/db";
import { comments as commentsTable } from "@/db/schema";
import { and, eq, isNull, desc, asc, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import CommentInteractions from "./CommentInteractions";

interface ServerCommentSectionProps {
  mangaId: string;
  imageIndex?: number | null;
  title?: string;
}

/**
 * Server Component for Comment Section
 * Fetches initial comments on the server for better performance and SEO
 */
export default async function ServerCommentSection({
  mangaId,
  imageIndex = null,
  title = "ความคิดเห็น",
}: ServerCommentSectionProps) {
  // Get current user session for vote state
  const session = await auth.api.getSession({ headers: await headers() });
  const currentUserId = session?.user?.id;

  // Fetch comments on server - no client-side JS needed for initial load
  const comments = await db.query.comments.findMany({
    where: and(
      eq(commentsTable.mangaId, mangaId),
      imageIndex !== null
        ? eq(commentsTable.imageIndex, imageIndex)
        : isNull(commentsTable.imageIndex),
      isNull(commentsTable.parentId),
    ),
    with: {
      profile: {
        columns: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      commentVotes: {
        columns: {
          userId: true,
          value: true,
        },
      },
      comments: {
        with: {
          profile: {
            columns: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          commentVotes: {
            columns: {
              userId: true,
              value: true,
            },
          },
        },
        orderBy: [asc(commentsTable.createdAt)],
      },
    },
    orderBy: [desc(commentsTable.createdAt)],
    limit: 20,
  });

  // Get total count for display
  const [{ count: totalCount }] = await db.select({ count: count() }).from(commentsTable).where(
    and(
      eq(commentsTable.mangaId, mangaId),
      imageIndex !== null
        ? eq(commentsTable.imageIndex, imageIndex)
        : isNull(commentsTable.imageIndex),
      isNull(commentsTable.parentId),
    )
  );

  // Check if there are more comments
  const hasMore = totalCount > comments.length;

  // Normalize shape for client component (user, votes, replies)
  const serializedComments = comments.map((comment) => ({
    ...comment,
    user: comment.profile,
    votes: comment.commentVotes,
    replies: (comment.comments ?? []).map((reply: any) => ({
      ...reply,
      user: reply.profile,
      votes: reply.commentVotes,
    })),
  }));

  // Pass to client component for interactivity
  return (
    <CommentInteractions
      mangaId={mangaId}
      imageIndex={imageIndex}
      initialComments={serializedComments as any}
      initialTotal={totalCount}
      initialHasMore={hasMore}
      title={title}
      currentUserId={currentUserId}
    />
  );
}

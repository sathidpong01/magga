import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  // Fetch comments on server - no client-side JS needed for initial load
  const comments = await prisma.comment.findMany({
    where: {
      mangaId,
      imageIndex: imageIndex ?? null,
      parentId: null, // Only top-level comments
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      votes: {
        select: {
          userId: true,
          value: true,
        },
      },
      replies: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          votes: {
            select: {
              userId: true,
              value: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Get total count for display
  const totalCount = await prisma.comment.count({
    where: {
      mangaId,
      imageIndex: imageIndex ?? null,
      parentId: null,
    },
  });

  // Check if there are more comments
  const hasMore = totalCount > comments.length;

  // Serialize dates for client component
  const serializedComments = comments.map((comment) => ({
    ...comment,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    replies: comment.replies.map((reply) => ({
      ...reply,
      createdAt: reply.createdAt.toISOString(),
      updatedAt: reply.updatedAt.toISOString(),
    })),
  }));

  // Pass to client component for interactivity
  return (
    <CommentInteractions
      mangaId={mangaId}
      imageIndex={imageIndex}
      initialComments={serializedComments}
      initialTotal={totalCount}
      initialHasMore={hasMore}
      title={title}
      currentUserId={currentUserId}
    />
  );
}

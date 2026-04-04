import { db } from "@/db";
import { comments as commentsTable } from "@/db/schema";
import { count, desc } from "drizzle-orm";
import CommentsManager, {
  type AdminComment,
  type AdminCommentsPagination,
} from "./CommentsManager";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage() {
  const page = 1;
  const limit = 20;

  const comments = await db.query.comments.findMany({
    orderBy: [desc(commentsTable.createdAt)],
    offset: 0,
    limit,
    with: {
      profile: {
        columns: { id: true, name: true, username: true, image: true },
      },
      manga: {
        columns: { id: true, title: true, slug: true },
      },
      comment: {
        columns: { id: true, content: true },
        with: {
          profile: {
            columns: { name: true, username: true },
          },
        },
      },
    },
  });

  const [{ total }] = await db.select({ total: count() }).from(commentsTable);
  const totalNum = Number(total);

  const initialComments: AdminComment[] = comments.map((comment) => ({
    ...comment,
    manga: {
      id: comment.manga?.id ?? "",
      title: comment.manga?.title ?? "",
      slug: comment.manga?.slug ?? null,
    },
    user: {
      id: comment.profile?.id ?? "",
      name: comment.profile?.name ?? null,
      username: comment.profile?.username ?? null,
      image: comment.profile?.image ?? null,
    },
    parent: comment.comment
      ? {
          id: comment.comment.id,
          content: comment.comment.content,
          user: {
            name: (comment.comment as { profile?: { name?: string | null; username?: string | null } }).profile?.name ?? null,
            username: (comment.comment as { profile?: { name?: string | null; username?: string | null } }).profile?.username ?? null,
          },
        }
      : null,
  }));

  const initialPagination: AdminCommentsPagination = {
    page,
    limit,
    total: totalNum,
    totalPages: Math.ceil(totalNum / limit),
  };

  return (
    <CommentsManager
      initialComments={initialComments}
      initialPagination={initialPagination}
    />
  );
}

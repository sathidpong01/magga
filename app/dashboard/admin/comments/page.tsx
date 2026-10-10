import { requireAdminPage } from "@/lib/auth-helpers";
import type { Metadata } from "next";
import { db } from "@/db";
import { comments as commentsTable } from "@/db/schema";
import { headers } from "next/headers";
import { requireModerationAdmin } from "@/lib/comments/moderation";
import { decorateCommentImagePreviews } from "@/lib/comments/assets";
import { count, desc } from "drizzle-orm";
import CommentsManager, {
  type AdminComment,
  type AdminCommentsPagination,
} from "./CommentsManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "จัดการความคิดเห็น - MAGGA",
  description: "ตรวจสอบและจัดการความคิดเห็นบน MAGGA",
  openGraph: { title: "จัดการความคิดเห็น - MAGGA", description: "ตรวจสอบและจัดการความคิดเห็นบน MAGGA" },
  twitter: { title: "จัดการความคิดเห็น - MAGGA", description: "ตรวจสอบและจัดการความคิดเห็นบน MAGGA" },
};

export default async function AdminCommentsPage() {
  await requireAdminPage();
  await requireModerationAdmin(new Request(process.env.BETTER_AUTH_URL || "http://localhost:3000", { headers: await headers() }));
  const page = 1;
  const limit = 20;

  const comments = await db.query.comments.findMany({
    orderBy: [desc(commentsTable.createdAt)],
    offset: 0,
    limit,
    with: {
      guest: { columns: { isBanned: true } },
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

  const initialComments: AdminComment[] = await decorateCommentImagePreviews(comments.map((comment) => ({
    ...comment,
    guestIsBanned: comment.guest?.isBanned ?? false,
    manga: {
      id: comment.manga?.id ?? "",
      title: comment.manga?.title ?? "",
      slug: comment.manga?.slug ?? null,
    },
    user: {
      id: comment.profile?.id ?? "",
      name: comment.profile?.name ?? comment.authorName ?? null,
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
  })));

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

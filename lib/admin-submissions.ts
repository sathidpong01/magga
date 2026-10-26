import { db } from "@/db";
import { mangaSubmissions as submissions, profiles } from "@/db/schema";
import { and, count, desc, eq, ilike, or, getTableColumns } from "drizzle-orm";
import { escapeLike } from "./admin-pagination";
export async function readAdminSubmissions({
  status,
  page,
  limit,
  search,
}: {
  status: string;
  page: number;
  limit: number;
  search: string;
}) {
  const pattern = `%${escapeLike(search)}%`;
  const where = and(
    status && status !== "ALL" ? eq(submissions.status, status) : undefined,
    search
      ? or(
          ilike(submissions.title, pattern),
          ilike(profiles.username, pattern),
        )
      : undefined,
  );
  const [items, [total]] = await Promise.all([
    db.select({...getTableColumns(submissions),profile:{name:profiles.name,email:profiles.email,username:profiles.username}})
      .from(submissions).leftJoin(profiles,eq(submissions.userId,profiles.id)).where(where)
      .orderBy(desc(submissions.submittedAt),desc(submissions.id)).limit(limit).offset((page-1)*limit),
    db.select({ total: count() }).from(submissions).leftJoin(profiles,eq(submissions.userId,profiles.id)).where(where),
  ]);
  return { items, total: Number(total.total) };
}

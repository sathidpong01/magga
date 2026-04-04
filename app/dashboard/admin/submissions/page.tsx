import { db } from "@/db";
import { mangaSubmissions as submissionsTable } from "@/db/schema";
import { desc, count } from "drizzle-orm";
import SubmissionsManager, {
  type AdminSubmission,
} from "./SubmissionsManager";

export const dynamic = "force-dynamic";

export default async function AdminSubmissionsPage() {
  const limit = 10;
  const submissions = await db.query.mangaSubmissions.findMany({
    with: {
      profile: {
        columns: { name: true, email: true, username: true },
      },
    },
    orderBy: [desc(submissionsTable.submittedAt)],
    offset: 0,
    limit,
  });

  const [{ total }] = await db.select({ total: count() }).from(submissionsTable);
  const totalPages = Math.max(1, Math.ceil(Number(total) / limit));

  const initialSubmissions: AdminSubmission[] = submissions.map((submission) => ({
    id: submission.id,
    title: submission.title,
    status: submission.status,
    submittedAt: submission.submittedAt,
    coverImage: submission.coverImage,
    user: {
      name: submission.profile?.name ?? null,
      username: submission.profile?.username ?? null,
      email: submission.profile?.email ?? null,
    },
  }));

  return (
    <SubmissionsManager
      initialSubmissions={initialSubmissions}
      initialTotalPages={totalPages}
    />
  );
}

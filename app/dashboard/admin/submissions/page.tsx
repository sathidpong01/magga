import { requireAdminPage } from "@/lib/auth-helpers";
import type { Metadata } from "next";
import { db } from "@/db";
import { mangaSubmissions as submissionsTable } from "@/db/schema";
import { desc, count, eq } from "drizzle-orm";
import { normalizeSubmissionStatus } from "@/lib/submission-status";
import SubmissionsManager, {
  type AdminSubmission,
} from "./SubmissionsManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ตรวจรายการฝากลง - MAGGA",
  description: "ตรวจสอบผลงานที่ฝากลงบน MAGGA",
  openGraph: { title: "ตรวจรายการฝากลง - MAGGA", description: "ตรวจสอบผลงานที่ฝากลงบน MAGGA" },
  twitter: { title: "ตรวจรายการฝากลง - MAGGA", description: "ตรวจสอบผลงานที่ฝากลงบน MAGGA" },
};

export default async function AdminSubmissionsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdminPage();
  const status = normalizeSubmissionStatus((await searchParams).status);
  const where = status === "ALL" ? undefined : eq(submissionsTable.status, status);
  const limit = 10;
  const submissions = await db.query.mangaSubmissions.findMany({
    where,
    with: {
      profile: {
        columns: { name: true, email: true, username: true },
      },
    },
    orderBy: [desc(submissionsTable.submittedAt)],
    offset: 0,
    limit,
  });

  const [{ total }] = await db.select({ total: count() }).from(submissionsTable).where(where);
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
      initialStatus={status}
    />
  );
}

import { readAdminSubmissions } from "@/lib/admin-submissions";
import { adminPageQuery } from "@/lib/admin-pagination";
import { requireAdminPage } from "@/lib/auth-helpers";
import type { Metadata } from "next";



import { normalizeSubmissionStatus } from "@/lib/submission-status";
import SubmissionsManager, { type AdminSubmission } from "../SubmissionsManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ตรวจรายการฝากลง - MAGGA",
  description: "ตรวจสอบผลงานที่ฝากลงบน MAGGA",
  openGraph: {
    title: "ตรวจรายการฝากลง - MAGGA",
    description: "ตรวจสอบผลงานที่ฝากลงบน MAGGA",
  },
  twitter: {
    title: "ตรวจรายการฝากลง - MAGGA",
    description: "ตรวจสอบผลงานที่ฝากลงบน MAGGA",
  },
};

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; search?: string }>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const status = normalizeSubmissionStatus(params.status),
    query = adminPageQuery(params),
    limit = 10;
  const result = await readAdminSubmissions({
    status,
    page: query.page,
    limit,
    search: query.search,
  });
  const submissions = result.items;
  const totalPages = Math.max(1, Math.ceil(result.total / limit));

  const initialSubmissions: AdminSubmission[] = submissions.map(
    (submission) => ({
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
    }),
  );

  return (
    <SubmissionsManager
      initialSubmissions={initialSubmissions}
      initialTotalPages={totalPages}
      initialStatus={status}
      initialPage={query.page}
      initialSearch={query.search}
    />
  );
}

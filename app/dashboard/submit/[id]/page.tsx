import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import MangaForm from "@/app/components/forms/MangaForm";
import { db } from "@/db";
import { mangaSubmissions as submissionsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { extractMangaPageUrls } from "@/lib/manga-pages";

export default async function EditSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    redirect(`/auth/signin?callbackUrl=/dashboard/submit/${id}`);
  }

  const submission = await db.query.mangaSubmissions.findFirst({
    where: and(
      eq(submissionsTable.id, id),
      eq(submissionsTable.userId, session.user.id)
    ),
    with: {
      author: true,
      category: true,
      mangaSubmissionTags: {
        with: {
          tag: true,
        },
      },
    },
  });

  if (
    !submission ||
    (submission.status !== "PENDING" && submission.status !== "REJECTED")
  ) {
    notFound();
  }

  const submissionForForm = {
    ...submission,
    pages: extractMangaPageUrls(JSON.parse(submission.pages)),
    tags: submission.mangaSubmissionTags.map((item) => item.tag),
  };

  return <MangaForm manga={submissionForForm as any} mode="submission" />;
}

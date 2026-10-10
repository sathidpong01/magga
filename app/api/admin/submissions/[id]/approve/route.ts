import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { 
  manga as mangaTable,
  mangaTags as mangaTagsTable,
  authors,
  mangaSubmissions as mangaSubmissionsTable 
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { z } from "zod";
import { invalidateMangaContent } from "@/lib/manga-invalidation";
import { randomUUID } from "node:crypto";
import { extractMangaPageUrls } from "@/lib/manga-pages";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers, query: { disableCookieCache: true } });
    const authError = requireAdmin(session);
    if (authError || !session) {
      return authError ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = z.object({ reviewNote: z.string().max(5000).optional(), publishImmediately: z.boolean().default(false) }).safeParse(body);
    if (!z.string().uuid().safeParse(id).success || !parsed.success) return NextResponse.json({ error: "Invalid approval input" }, { status: 400 });
    const { reviewNote, publishImmediately } = parsed.data;

    const result = await db.transaction(async (tx) => {
      // Lock before checking status: another approval or edit must wait.
      await tx.select({ id: mangaSubmissionsTable.id }).from(mangaSubmissionsTable).where(eq(mangaSubmissionsTable.id, id)).for("update");
      // 1. Get Submission
      const submission = await tx.query.mangaSubmissions.findFirst({
        where: eq(mangaSubmissionsTable.id, id),
        with: { mangaSubmissionTags: true },
      });

      if (!submission) {
        return { error: "Submission not found", status: 404 };
      }

      if (submission.status === "APPROVED") {
        return { error: "Submission already approved", status: 400 };
      }

      // 2. Create Manga Record
      const baseSlug =
        submission.slug ||
        submission.title
          .toLowerCase()
          .trim()
          .replace(/[\s]+/g, "-")
          .replace(/[^\w\-\u0E00-\u0E7F]+/g, "")
          .replace(/\-\-+/g, "-");
      const [existingManga] = await tx
        .select({ id: mangaTable.id })
        .from(mangaTable)
        .where(eq(mangaTable.slug, baseSlug))
        .limit(1);
      const finalSlug = existingManga ? `${baseSlug}-${randomUUID()}` : baseSlug;
      const parsedPages = extractMangaPageUrls(JSON.parse(submission.pages));
      
      const [author] = submission.authorId ? await tx.select({ name: authors.name }).from(authors).where(eq(authors.id, submission.authorId)).limit(1) : [];
      const [manga] = await tx.insert(mangaTable).values({
        title: submission.title,
        slug: finalSlug,
        description: submission.description,
        coverImage: submission.coverImage,
        pages: parsedPages,
        categoryId: submission.categoryId,
        authorId: submission.authorId,
        authorName: author?.name ?? null,
        isHidden: !publishImmediately,
      }).returning({ id: mangaTable.id, slug: mangaTable.slug });

      if (submission.mangaSubmissionTags && submission.mangaSubmissionTags.length > 0) {
        await tx.insert(mangaTagsTable).values(
          submission.mangaSubmissionTags.map((t) => ({
            mangaId: manga.id,
            tagId: t.tagId,
          }))
        );
      }

      // 3. Update Submission Status
      await tx.update(mangaSubmissionsTable).set({
        status: "APPROVED",
        reviewedAt: new Date().toISOString(),
        reviewedBy: session.user.id,
        reviewNote,
        approvedMangaId: manga.id,
      }).where(eq(mangaSubmissionsTable.id, id));

      return { data: manga };
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    let cacheRefreshPending = false;
    try {
      revalidatePath("/dashboard/admin/submissions");
      revalidatePath("/dashboard/submissions");
      invalidateMangaContent([result.data?.slug]);
    } catch {
      cacheRefreshPending = true;
      console.error("Submission approved; cache refresh pending");
    }

    return NextResponse.json({ success: true, mangaId: result.data?.id, cacheRefreshPending });
  } catch (error) {
    console.error("Approve submission error:", error);
    return NextResponse.json(
      { error: "Failed to approve submission" },
      { status: 500 }
    );
  }
}

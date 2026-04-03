import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { 
  manga as mangaTable,
  mangaTags as mangaTagsTable,
  mangaSubmissions as mangaSubmissionsTable 
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    const authError = requireAdmin(session);
    if (authError || !session) {
      return authError ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { reviewNote, publishImmediately } = body;

    const result = await db.transaction(async (tx) => {
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
      const finalSlug = existingManga ? `${baseSlug}-${Date.now()}` : baseSlug;
      const parsedPages = JSON.parse(submission.pages) as string[];
      
      const [manga] = await tx.insert(mangaTable).values({
        title: submission.title,
        slug: finalSlug,
        description: submission.description,
        coverImage: submission.coverImage,
        pages: parsedPages,
        categoryId: submission.categoryId,
        authorId: submission.authorId,
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

    // 4. Revalidate home page cache to show new manga immediately
    revalidatePath("/dashboard/admin/submissions");
    revalidatePath("/dashboard/submissions");
    revalidatePath("/");
    revalidatePath(`/${result.data?.slug}`);

    return NextResponse.json({ success: true, mangaId: result.data?.id });
  } catch (error) {
    console.error("Approve submission error:", error);
    return NextResponse.json(
      { error: "Failed to approve submission" },
      { status: 500 }
    );
  }
}

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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "admin" && userRole !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      const finalSlug = submission.slug || submission.title.toLowerCase().replace(/\s+/g, "-");
      
      const [manga] = await tx.insert(mangaTable).values({
        title: submission.title,
        slug: finalSlug,
        description: submission.description,
        coverImage: submission.coverImage,
        pages: submission.pages as any, // Expecting valid json string
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

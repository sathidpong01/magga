import { NextResponse } from "next/server";
import { db } from "@/db";
import { mangaSubmissions as submissionsTable, mangaSubmissionTags as submissionTagsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { extractMangaPageUrls } from "@/lib/manga-pages";

// GET: Fetch submission details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session || (session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const submission = await db.query.mangaSubmissions.findFirst({
      where: eq(submissionsTable.id, id),
      with: {
        profile: {
          columns: {
            id: true,
            name: true,
            email: true,
            username: true,
            image: true,
            createdAt: true,
          },
        },
        category: true,
        mangaSubmissionTags: {
          with: {
            tag: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...submission,
      user: submission.profile,
      pages: extractMangaPageUrls(JSON.parse(submission.pages)),
      tags: submission.mangaSubmissionTags,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch submission" },
      { status: 500 }
    );
  }
}

// PUT: Update submission details (Edit before approve)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title, slug, description, categoryId, tagIds, status } = body;

    const updateData: any = {
      title,
      slug,
      description,
      categoryId,
    };

    if (status) updateData.status = status;

    // Handle Tags Update if provided
    if (tagIds) {
      // Delete existing tags
      await db
        .delete(submissionTagsTable)
        .where(eq(submissionTagsTable.submissionId, id));
      // Create new tags
      if (tagIds.length > 0) {
        await db.insert(submissionTagsTable).values(
          tagIds.map((tagId: string) => ({
            submissionId: id,
            tagId,
          }))
        );
      }
    }

    const [updatedSubmission] = await db
      .update(submissionsTable)
      .set(updateData)
      .where(eq(submissionsTable.id, id))
      .returning();

    return NextResponse.json(updatedSubmission);
  } catch (error) {
    console.error("Update submission error:", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }
}

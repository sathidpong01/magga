import { NextResponse } from "next/server";
import { db } from "@/db";
import { mangaSubmissions as submissionsTable, mangaSubmissionTags as submissionTagsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { extractMangaPageUrls } from "@/lib/manga-pages";
import { z } from "zod";
import { submissionSchema } from "@/lib/submissions";
import { requireAdmin } from "@/lib/auth-helpers";

// GET: Fetch submission details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers, query: { disableCookieCache: true } });
    const authError = requireAdmin(session);
    if (authError) return authError;

    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

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
    }, { headers: { "Cache-Control": "private, no-store" } });
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
    const session = await auth.api.getSession({ headers: req.headers, query: { disableCookieCache: true } });
    const authError = requireAdmin(session);
    if (authError) return authError;

    const { id } = await params;
    const body = await req.json();
    const parsed = submissionSchema.omit({ coverImage: true, pages: true, status: true }).partial().extend({ status: z.enum(["PENDING", "UNDER_REVIEW", "REJECTED"]).optional() }).safeParse(body);
    if (!z.string().uuid().safeParse(id).success || !parsed.success) return NextResponse.json({ error: "Invalid submission input" }, { status: 400 });
    const updatedSubmission = await db.transaction(async tx => {
      const [current] = await tx.select({ status: submissionsTable.status }).from(submissionsTable).where(eq(submissionsTable.id, id)).for("update");
      if (!current || current.status === "APPROVED") return null;
      const { tagIds, ...values } = parsed.data;
      if (tagIds) {
        await tx.delete(submissionTagsTable).where(eq(submissionTagsTable.submissionId, id));
        if (tagIds.length) await tx.insert(submissionTagsTable).values(tagIds.map(tagId => ({ submissionId: id, tagId })));
      }
      const [updated] = await tx.update(submissionsTable).set({ ...values, updatedAt: new Date().toISOString() }).where(eq(submissionsTable.id, id)).returning();
      return updated;
    });
    if (!updatedSubmission) return NextResponse.json({ error: "Submission not found or already approved" }, { status: 409 });

    return NextResponse.json(updatedSubmission);
  } catch (error) {
    console.error("Update submission error:", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }
}

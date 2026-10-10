import { NextResponse } from "next/server";
import { db } from "@/db";
import { mangaSubmissions as submissions, mangaSubmissionTags as tags } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { authenticateRequest } from "@/lib/auth-helpers";
import { submissionSchema } from "@/lib/submissions";
import { extractMangaPageUrls } from "@/lib/manga-pages";
import { z } from "zod";

const updateSchema = submissionSchema.omit({ slug: true, authorId: true, status: true }).partial().extend({ status: z.enum(["PENDING"]).optional() });
class SubmissionError extends Error { constructor(message: string, readonly status: number) { super(message); } }
function failure(error: unknown) {
  if (error instanceof SubmissionError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  console.error("Submission operation failed");
  return NextResponse.json({ error: "Submission operation failed" }, { status: 500 });
}
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(req, { fresh: true }); if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    const submission = await db.query.mangaSubmissions.findFirst({
      where: and(eq(submissions.id, id), eq(submissions.userId, auth.caller.user.id)),
      with: { mangaSubmissionTags: { with: { tag: true } }, category: true },
    });
    if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    return NextResponse.json({ ...submission, tags: submission.mangaSubmissionTags.map(t => t.tag), pages: extractMangaPageUrls(JSON.parse(submission.pages)) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(req); if (!auth.ok) return auth.response;
    const { id } = await params;
    const parsed = updateSchema.safeParse(await req.json());
    if (!z.string().uuid().safeParse(id).success || !parsed.success) return NextResponse.json({ error: "Invalid submission input" }, { status: 400 });
    const submission = await db.transaction(async tx => {
      const [current] = await tx.select({ status: submissions.status }).from(submissions).where(and(eq(submissions.id, id), eq(submissions.userId, auth.caller.user.id))).for("update");
      if (!current) throw new SubmissionError("Submission not found", 404);
      if (!["PENDING", "REJECTED"].includes(current.status)) throw new SubmissionError("Cannot edit submission in current status", 409);
      const { pages, tagIds, ...values } = parsed.data;
      const update = { ...values, updatedAt: new Date().toISOString(), ...(pages ? { pages: JSON.stringify(pages) } : {}), ...(values.status === "PENDING" ? { submittedAt: new Date().toISOString(), reviewedAt: null, reviewedBy: null, rejectionReason: null, reviewNote: null } : {}) };
      if (tagIds) {
        await tx.delete(tags).where(eq(tags.submissionId, id));
        if (tagIds.length) await tx.insert(tags).values(tagIds.map(tagId => ({ submissionId: id, tagId })));
      }
      const [updated] = await tx.update(submissions).set(update).where(eq(submissions.id, id)).returning();
      return updated;
    });
    return NextResponse.json({ success: true, submission });
  } catch (error) { return failure(error); }
}
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(req); if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    await db.transaction(async tx => {
      const [current] = await tx.select({ status: submissions.status }).from(submissions).where(and(eq(submissions.id, id), eq(submissions.userId, auth.caller.user.id))).for("update");
      if (!current) throw new SubmissionError("Submission not found", 404);
      if (!["PENDING", "REJECTED"].includes(current.status)) throw new SubmissionError("Cannot delete submission in current status", 409);
      await tx.delete(tags).where(eq(tags.submissionId, id));
      await tx.delete(submissions).where(eq(submissions.id, id));
    });
    return NextResponse.json({ success: true });
  } catch (error) { return failure(error); }
}

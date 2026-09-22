import { NextResponse } from "next/server";
import { db } from "@/db";
import { loginAttempts as loginAttemptsTable, mangaSubmissions as submissionsTable } from "@/db/schema";
import { lt, eq, and, inArray } from "drizzle-orm";
import { deleteAssets } from "@/lib/storage";
import { extractMangaPageUrls } from "@/lib/manga-pages";

export async function GET(req: Request) {
  // Verify secret to prevent unauthorized calls (supports both query param and header)
  const { searchParams } = new URL(req.url);
  const secretParam = searchParams.get("secret");
  const authHeader = req.headers.get("authorization");
  const secretHeader = authHeader?.replace("Bearer ", "");
  
  if (secretParam !== process.env.CRON_SECRET && secretHeader !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = {
      rateLimitsDeleted: 0,
      submissionsDeleted: 0,
      r2FilesDeleted: 0,
    };

    // 1. Clean up expired rate limit records (LoginAttempt)
    try {
      const deleted = await db
        .delete(loginAttemptsTable)
        .where(lt(loginAttemptsTable.expiresAt, new Date()))
        .returning({ id: loginAttemptsTable.identifier });
      results.rateLimitsDeleted = deleted.length;
      console.log(`[Cron Cleanup] Deleted ${deleted.length} expired rate limit records`);
    } catch (err) {
      console.error("[Cron Cleanup] Rate limit cleanup failed:", err);
    }

    // 2. Find rejected submissions older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldRejectedSubmissions = await db
      .select()
      .from(submissionsTable)
      .where(
        and(
          eq(submissionsTable.status, "REJECTED"),
          lt(submissionsTable.updatedAt, thirtyDaysAgo.toISOString())
        )
      );

    if (oldRejectedSubmissions.length > 0) {
      // Collect ALL asset URLs to delete
      const allUrls: string[] = [];

      for (const submission of oldRejectedSubmissions) {
        if (submission.coverImage) {
          allUrls.push(submission.coverImage);
        }
        try {
          const pageUrls = extractMangaPageUrls(JSON.parse(submission.pages as string));
          allUrls.push(...pageUrls);
        } catch { /* skip unparseable pages */ }
      }

      try {
        results.r2FilesDeleted = await deleteAssets(allUrls);
      } catch (err) {
        console.error("[Cron Cleanup] Storage batch delete failed:", err);
      }

      // Batch delete all submission records
      const ids = oldRejectedSubmissions.map((s) => s.id);
      await db.delete(submissionsTable).where(inArray(submissionsTable.id, ids));
      results.submissionsDeleted = ids.length;

      console.log(
        `[Cron Cleanup] Deleted ${results.submissionsDeleted} submissions, ${results.r2FilesDeleted} R2 files`
      );
    }

    return NextResponse.json({ 
      success: true,
      timestamp: new Date().toISOString(),
      ...results
    });

  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}

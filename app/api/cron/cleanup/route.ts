import { NextResponse } from "next/server";
import { db } from "@/db";
import { loginAttempts as loginAttemptsTable, mangaSubmissions as submissionsTable, advertisementEvents } from "@/db/schema";
import { lt, eq, and, sql, count } from "drizzle-orm";

export async function GET(req: Request) {
  // Verify secret to prevent unauthorized calls (supports both query param and header)
  const { searchParams } = new URL(req.url);
  const secretParam = searchParams.get("secret");
  const authHeader = req.headers.get("authorization");
  const secretHeader = authHeader?.replace("Bearer ", "");
  
  if (!process.env.CRON_SECRET || (secretParam !== process.env.CRON_SECRET && secretHeader !== process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = {
      rateLimitsDeleted: 0,
      submissionsDeleted: 0,
      r2FilesDeleted: 0,
      submissionsDeferred: 0,
      adEventsDeleted: 0,
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

    const deletedEvents = await db.execute(sql`
      WITH deleted AS (
        DELETE FROM ${advertisementEvents}
        WHERE ${advertisementEvents.createdAt} < ${thirtyDaysAgo.toISOString()}::timestamptz
        RETURNING event_id
      ) SELECT count(*)::int AS count FROM deleted
    `);
    results.adEventsDeleted = Number(deletedEvents[0]?.count || 0);

    const [deferred] = await db
      .select({ count: count() })
      .from(submissionsTable)
      .where(
        and(
          eq(submissionsTable.status, "REJECTED"),
          lt(submissionsTable.updatedAt, thirtyDaysAgo.toISOString())
        )
      );

    // Submission URLs can reference published or externally owned objects.
    // Keep the records as a retry/review ledger until ownership and references
    // are migrated. A status snapshot is never authority to delete an object.
    results.submissionsDeferred = Number(deferred?.count ?? 0);

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

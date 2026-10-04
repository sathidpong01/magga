import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { advertisements, advertisementEvents } from "@/db/schema";
import { adEventInput } from "@/lib/advertisement-input";
import { checkRateLimit } from "@/lib/rate-limit";
import { createHash } from "node:crypto";
import { z } from "zod";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const parsed = adEventInput.safeParse(await request.json());
    if (!parsed.success || !z.uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const key = createHash("sha256").update(ip).digest("hex");
    if (!(await checkRateLimit(`ad-events:${key}`, 120, 60000)).allowed) {
      return NextResponse.json({ error: "Too many events" }, { status: 429 });
    }
    const { eventId, kind } = parsed.data;
    const column = sql.identifier(kind === "impression" ? "impressions" : "clicks");
    // Deduplication and counter update commit together in one database round trip.
    await db.execute(sql`
      WITH recorded AS (
        INSERT INTO ${advertisementEvents} (event_id, ad_id, kind)
        SELECT ${eventId}::uuid, ${advertisements.id}, ${kind}
        FROM ${advertisements}
        WHERE ${advertisements.id} = ${id}::uuid AND ${advertisements.isActive} = true
          AND (${kind} = 'impression' OR nullif(${advertisements.linkUrl}, '') IS NOT NULL)
        ON CONFLICT DO NOTHING RETURNING ad_id
      )
      UPDATE ${advertisements} SET ${column} = ${column} + 1
      WHERE ${advertisements.id} IN (SELECT ad_id FROM recorded)
    `);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to record advertisement event", error);
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }
}

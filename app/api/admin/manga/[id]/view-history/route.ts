import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-helpers";
import { historyPeriods, type HistoryPeriod } from "@/lib/view-history";
import { historyUnavailable, readViewHistory } from "@/lib/admin-view-history";
import { z } from "zod";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request, { role: "admin" });
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const period = new URL(request.url).searchParams.get("period") ?? "7";
  const headers = { "Cache-Control": "private, no-store" };
  if (!z.uuid().safeParse(id).success || !historyPeriods.includes(period as HistoryPeriod)) return NextResponse.json({ error: "ช่วงเวลาหรือเรื่องไม่ถูกต้อง" }, { status: 400, headers });
  try {
    const result = await readViewHistory(id, period as HistoryPeriod);
    return result ? NextResponse.json(result, { headers }) : NextResponse.json({ error: "ยังไม่ได้เริ่มเก็บสถิติรายวันของเรื่องนี้" }, { status: 404, headers });
  } catch (error) {
    if (!historyUnavailable(error)) console.error("View history read failed", error);
    return NextResponse.json({ error: historyUnavailable(error) ? "ยังไม่ได้เปิดเก็บสถิติรายวัน" : "โหลดสถิติไม่ได้ กรุณาลองใหม่" }, { status: 503, headers });
  }
}

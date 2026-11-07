import { pollDatabase } from "@/lib/polls/database";
import { getAdminPoll } from "@/lib/polls/service";
import { pollAdmin, pollFailure, privateHeaders } from "@/lib/polls/http";
import { csvCell, requirePollId } from "@/lib/polls/validation";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await pollAdmin(request);
    const poll = await getAdminPoll(
      pollDatabase,
      requirePollId((await context.params).id),
    );
    const rows: (string | number)[][] = [
      ["โพล", poll.title],
      ["บัตรโหวตที่นับผล", poll.total ?? 0],
      ["บัตรที่คัดออก", poll.excluded],
      ["อัปเดตเมื่อ", poll.serverNow],
      [],
      ["ตัวเลือก", "คะแนน", "% ของบัตรโหวต"],
      ...poll.options.map((o) => [
        o.label,
        o.votes ?? 0,
        poll.total ? (((o.votes ?? 0) / poll.total) * 100).toFixed(2) : "0.00",
      ]),
    ];
    return new Response(
      "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n"),
      {
        headers: {
          ...privateHeaders,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="poll-${poll.id}.csv"`,
        },
      },
    );
  } catch (error) {
    return pollFailure(error);
  }
}

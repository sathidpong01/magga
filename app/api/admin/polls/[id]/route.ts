import { z } from "zod";
import { pollDatabase } from "@/lib/polls/database";
import {
  duplicatePoll,
  getAdminPoll,
  moderateBallot,
  pollActivity,
  transitionPoll,
  updatePoll,
} from "@/lib/polls/service";
import {
  pollAdmin,
  pollFailure,
  pollJson,
  readPollJson,
} from "@/lib/polls/http";
import { parsePollInput, requirePollId } from "@/lib/polls/validation";
import { PollError } from "@/lib/polls/types";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  try {
    await pollAdmin(request);
    const id = requirePollId((await context.params).id);
    const page = Math.max(
      1,
      Math.min(
        10000,
        Math.floor(Number(new URL(request.url).searchParams.get("page")) || 1),
      ),
    );
    return pollJson({
      poll: await getAdminPoll(pollDatabase, id),
      ...(await pollActivity(pollDatabase, id, page)),
    });
  } catch (error) {
    return pollFailure(error);
  }
}
export async function PUT(request: Request, context: Context) {
  try {
    const caller = await pollAdmin(request, true);
    const id = requirePollId((await context.params).id);
    const body = z
      .object({ input: z.unknown(), version: z.number().int().positive() })
      .strict()
      .safeParse(await readPollJson(request));
    if (!body.success) throw new PollError("ข้อมูลไม่ถูกต้อง");
    return pollJson(
      await updatePoll(
        pollDatabase,
        id,
        caller.user.id,
        parsePollInput(body.data.input),
        body.data.version,
      ),
    );
  } catch (error) {
    return pollFailure(error);
  }
}
export async function POST(request: Request, context: Context) {
  try {
    const caller = await pollAdmin(request, true);
    const id = requirePollId((await context.params).id);
    const body = z
      .discriminatedUnion("action", [
        z.object({ action: z.literal("duplicate") }).strict(),
        z
          .object({
            action: z.enum(["publish", "pause", "resume", "close", "archive"]),
            version: z.number().int().positive(),
          })
          .strict(),
        z
          .object({
            action: z.enum(["exclude", "restore"]),
            ballotId: z.uuid(),
            reason: z.string().trim().min(1).max(500),
          })
          .strict(),
      ])
      .safeParse(await readPollJson(request));
    if (!body.success) throw new PollError("คำสั่งหรือเหตุผลไม่ถูกต้อง");
    if (body.data.action === "duplicate")
      return pollJson(
        await duplicatePoll(pollDatabase, id, caller.user.id),
        201,
      );
    if (body.data.action === "exclude" || body.data.action === "restore") {
      await moderateBallot(
        pollDatabase,
        id,
        body.data.ballotId,
        caller.user.id,
        body.data.action === "exclude",
        body.data.reason,
      );
      return pollJson({ success: true });
    }
    return pollJson(
      await transitionPoll(
        pollDatabase,
        id,
        caller.user.id,
        body.data.action,
        "version" in body.data ? body.data.version : 0,
      ),
    );
  } catch (error) {
    return pollFailure(error);
  }
}

import { pollDatabase } from "@/lib/polls/database";
import { createPoll, listPolls } from "@/lib/polls/service";
import {
  pollAdmin,
  pollFailure,
  pollJson,
  readPollJson,
} from "@/lib/polls/http";
import { parsePollInput } from "@/lib/polls/validation";
export async function GET(request: Request) {
  try {
    await pollAdmin(request);
    const url = new URL(request.url);
    const page = Math.max(
      1,
      Math.min(10000, Number(url.searchParams.get("page")) || 1),
    );
    return pollJson(
      await listPolls(
        pollDatabase,
        true,
        false,
        url.searchParams.get("search") || "",
        Math.floor(page),
        (url.searchParams.get("state") || "").slice(0, 20),
        url.searchParams.get("sort") || "newest",
      ),
    );
  } catch (error) {
    return pollFailure(error);
  }
}
export async function POST(request: Request) {
  try {
    const caller = await pollAdmin(request, true);
    return pollJson(
      await createPoll(
        pollDatabase,
        caller.user.id,
        parsePollInput(await readPollJson(request)),
      ),
      201,
    );
  } catch (error) {
    return pollFailure(error);
  }
}

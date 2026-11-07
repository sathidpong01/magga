import { pollDatabase } from "@/lib/polls/database";
import { getPublicPoll } from "@/lib/polls/service";
import {
  consumePollLimit,
  networkKey,
  resolveVoter,
} from "@/lib/polls/security";
import { pollFailure, pollJson } from "@/lib/polls/http";
import { requirePollId } from "@/lib/polls/validation";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const id = requirePollId((await context.params).id);
    await consumePollLimit(
      pollDatabase,
      `read:${networkKey(request.headers)}`,
      1200,
      60,
    );
    return pollJson(
      await getPublicPoll(
        pollDatabase,
        id,
        await resolveVoter(request.headers),
      ),
    );
  } catch (error) {
    return pollFailure(error);
  }
}

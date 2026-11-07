import { pollDatabase } from "@/lib/polls/database";
import { recordPollRejection, vote } from "@/lib/polls/service";
import {
  assertPollOrigin,
  consumePollLimit,
  networkKey,
  pollVerificationKey,
  resolveVoter,
  verifyPollChallenge,
} from "@/lib/polls/security";
import { pollFailure, pollJson, readPollJson } from "@/lib/polls/http";
import { parseVote, requirePollId } from "@/lib/polls/validation";
import { PollError } from "@/lib/polls/types";
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let id: string | undefined;
  try {
    assertPollOrigin(request);
    id = requirePollId((await context.params).id);
    const network = networkKey(request.headers);
    await consumePollLimit(pollDatabase, `vote:network:${network}`, 200, 900);
    await consumePollLimit(pollDatabase, `vote:burst:${network}`, 30, 30);
    const body = parseVote(await readPollJson(request));
    const voter = await resolveVoter(request.headers);
    if (!voter.guestHash && !voter.userId)
      throw new PollError("กรุณาเปิดใช้งาน cookie แล้วลองใหม่", 401);
    await consumePollLimit(
      pollDatabase,
      `vote:actor:${voter.guestHash || voter.userId}`,
      20,
      900,
    );
    const verificationKey = pollVerificationKey(id, voter, body.requestId, body.token);
    await vote(pollDatabase, id, voter, body, () =>
      verifyPollChallenge(
        request.headers,
        body.token,
        verificationKey,
      ),
    );
    return pollJson({ success: true });
  } catch (error) {
    const reasons: Record<
      string,
      "rate" | "verification" | "duplicate" | "closed"
    > = {
      RATE_LIMITED: "rate",
      VERIFICATION_REQUIRED: "verification",
      ALREADY_VOTED: "duplicate",
      POLL_CLOSED: "closed",
    };
    const reason = error instanceof PollError ? reasons[error.code] : undefined;
    if (id && reason)
      await recordPollRejection(pollDatabase, id, reason).catch(
        () => undefined,
      );
    return pollFailure(error);
  }
}

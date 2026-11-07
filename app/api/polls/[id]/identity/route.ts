import { pollDatabase } from "@/lib/polls/database";
import { getPublicPoll, linkVoterIdentity } from "@/lib/polls/service";
import {
  assertPollOrigin,
  consumePollLimit,
  issuePollSession,
  networkKey,
  POLL_COOKIE_SECONDS,
  pollCookieName,
  resolveVoter,
} from "@/lib/polls/security";
import { pollFailure, pollJson } from "@/lib/polls/http";
import { requirePollId } from "@/lib/polls/validation";
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertPollOrigin(request);
    const id = requirePollId((await context.params).id);
    await consumePollLimit(
      pollDatabase,
      `identity:${networkKey(request.headers)}`,
      100,
      900,
    );
    const voter = await resolveVoter(request.headers);
    await getPublicPoll(pollDatabase, id, voter);
    await linkVoterIdentity(pollDatabase, id, voter);
    const response = pollJson({
      ready: true,
      siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null,
    });
    if (!voter.guestHash)
      response.cookies.set(pollCookieName(), await issuePollSession(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: POLL_COOKIE_SECONDS,
      });
    return response;
  } catch (error) {
    return pollFailure(error);
  }
}

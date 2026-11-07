import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Container } from "@mui/material";
import { pollDatabase } from "@/lib/polls/database";
import { getPublicPoll } from "@/lib/polls/service";
import { resolveVoter } from "@/lib/polls/security";
import { requirePollId } from "@/lib/polls/validation";
import { PollError } from "@/lib/polls/types";
import PollVote from "@/app/components/features/polls/PollVote";
export const metadata: Metadata = {
  title: "ร่วมโหวต - MAGGA",
  robots: { index: false, follow: true },
};
export default async function PollPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const id = requirePollId((await params).id);
    const poll = await getPublicPoll(
      pollDatabase,
      id,
      await resolveVoter(await headers()),
    );
    return (
      <Container maxWidth="lg">
        <PollVote initial={poll} />
      </Container>
    );
  } catch (error) {
    if (error instanceof PollError && error.status === 404) notFound();
    throw error;
  }
}

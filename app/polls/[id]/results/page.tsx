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
  title: "ผลโหวต - MAGGA",
  robots: { index: false, follow: true },
};
export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const poll = await getPublicPoll(
      pollDatabase,
      requirePollId((await params).id),
      await resolveVoter(await headers()),
    );
    return (
      <Container maxWidth="lg">
        <PollVote initial={poll} resultsOnly />
      </Container>
    );
  } catch (error) {
    if (error instanceof PollError && error.status === 404) notFound();
    throw error;
  }
}

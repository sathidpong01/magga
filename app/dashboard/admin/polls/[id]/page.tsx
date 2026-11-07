import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth-helpers";
import { pollDatabase } from "@/lib/polls/database";
import { getAdminPoll } from "@/lib/polls/service";
import { requirePollId } from "@/lib/polls/validation";
import { PollError } from "@/lib/polls/types";
import PollWorkspace from "@/app/components/features/polls/PollWorkspace";
export const metadata = { title: "จัดการโพล - MAGGA" };
export default async function AdminPollPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  try {
    const poll = await getAdminPoll(
      pollDatabase,
      requirePollId((await params).id),
    );
    return <PollWorkspace key={poll.id} initial={poll} />;
  } catch (error) {
    if (error instanceof PollError && error.status === 404) notFound();
    throw error;
  }
}

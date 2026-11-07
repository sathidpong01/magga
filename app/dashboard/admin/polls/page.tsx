import { requireAdminPage } from "@/lib/auth-helpers";
import PollManager from "@/app/components/features/polls/PollManager";
export const metadata = { title: "จัดการโพล - MAGGA" };
export default async function AdminPollsPage() {
  await requireAdminPage();
  return <PollManager />;
}

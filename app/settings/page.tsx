import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { profiles as usersTable, blockedUsers, blockedTags, accounts } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { Container } from "@mui/material";
import AccountSettings from "./AccountSettings";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/auth/signin?callbackUrl=/settings");
  }

  const [user, blockedUserCount, blockedTagCount, linkedAccounts] = await Promise.all([
    db.query.profiles.findFirst({
      where: eq(usersTable.id, session.user.id),
      columns: {
        name: true,
        username: true,
        email: true,
        image: true,
        password: true,
        commentPreference: true,
      },
    }),
    db.select({ count: count() }).from(blockedUsers).where(eq(blockedUsers.userId, session.user.id)),
    db.select({ count: count() }).from(blockedTags).where(eq(blockedTags.userId, session.user.id)),
    db.select({ providerId: accounts.providerId }).from(accounts).where(eq(accounts.userId, session.user.id)),
  ]);

  if (!user) {
    redirect("/auth/signin?callbackUrl=/settings");
  }

  const linkedProviders = linkedAccounts.map((a) => a.providerId);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <AccountSettings
        user={user}
        hasPassword={!!user.password}
        blockedUserCount={blockedUserCount[0]?.count ?? 0}
        blockedTagCount={blockedTagCount[0]?.count ?? 0}
        linkedProviders={linkedProviders}
      />
    </Container>
  );
}

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { profiles as usersTable, blockedUsers, blockedTags, accounts } from "@/db/schema";
import { eq, count, sql } from "drizzle-orm";
import { Container } from "@mui/material";
import AccountSettings from "./AccountSettings";

export const metadata: Metadata = {
  title: "ตั้งค่าบัญชี - MAGGA",
  description: "จัดการโปรไฟล์ ความปลอดภัย และการตั้งค่าบัญชี MAGGA",
  openGraph: { title: "ตั้งค่าบัญชี - MAGGA", description: "จัดการโปรไฟล์ ความปลอดภัย และการตั้งค่าบัญชี MAGGA" },
  twitter: { title: "ตั้งค่าบัญชี - MAGGA", description: "จัดการโปรไฟล์ ความปลอดภัย และการตั้งค่าบัญชี MAGGA" },
};

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
        commentPreference: true,
      },
      extras: { legacyPasswordExists: sql<boolean>`${usersTable.password} IS NOT NULL AND ${usersTable.password} <> ''`.as("legacy_password_exists") },
    }),
    db.select({ count: count() }).from(blockedUsers).where(eq(blockedUsers.userId, session.user.id)),
    db.select({ count: count() }).from(blockedTags).where(eq(blockedTags.userId, session.user.id)),
    db.select({ providerId: accounts.providerId, hasPassword: sql<boolean>`${accounts.password} IS NOT NULL AND ${accounts.password} <> ''` }).from(accounts).where(eq(accounts.userId, session.user.id)),
  ]);

  if (!user) {
    redirect("/auth/signin?callbackUrl=/settings");
  }

  const linkedProviders = linkedAccounts.map((a) => a.providerId);
  const { legacyPasswordExists, ...publicUser } = user;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <AccountSettings
        user={publicUser}
        hasPassword={legacyPasswordExists || linkedAccounts.some((account) => account.providerId === "credential" && account.hasPassword)}
        blockedUserCount={blockedUserCount[0]?.count ?? 0}
        blockedTagCount={blockedTagCount[0]?.count ?? 0}
        linkedProviders={linkedProviders}
      />
    </Container>
  );
}

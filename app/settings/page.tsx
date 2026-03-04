import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { profiles as usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Box, Container } from "@mui/material";
import Sidebar from "./Sidebar";
import AccountSettings from "./AccountSettings";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/auth/signin?callbackUrl=/settings");
  }

  // Fetch user to check if they have a password
  const user = await db.query.profiles.findFirst({
    where: eq(usersTable.id, session.user.id),
    columns: { 
      name: true,
      username: true,
      email: true,
      image: true,
      password: true 
    },
  });

  if (!user) {
    redirect("/auth/signin?callbackUrl=/settings");
  }

  const hasPassword = !!user?.password;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", gap: 4, flexDirection: { xs: "column", md: "row" } }}>
        {/* Sidebar */}
        <Box sx={{ width: { xs: "100%", md: 280 }, flexShrink: 0 }}>
          <Sidebar />
        </Box>

        {/* Main Content */}
        <Box sx={{ flexGrow: 1 }}>
          <AccountSettings user={user} hasPassword={hasPassword} />
        </Box>
      </Box>
    </Container>
  );
}

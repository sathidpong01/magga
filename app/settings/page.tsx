import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Box, Container } from "@mui/material";
import Sidebar from "./Sidebar";
import AccountSettings from "./AccountSettings";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/settings");
  }

  // Fetch user to check if they have a password
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { 
      name: true,
      username: true,
      email: true,
      image: true,
      password: true 
    },
  });

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

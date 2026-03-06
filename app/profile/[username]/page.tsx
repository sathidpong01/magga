import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Container, Box, Typography } from "@mui/material";
import ProfileView from "./ProfileView";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  return {
    title: `โปรไฟล์ของ ${username} - MAGGA`,
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;

  const [profileUser, session] = await Promise.all([
    db.query.profiles.findFirst({
      where: or(eq(profiles.username, username), eq(profiles.id, username)),
      columns: {
        id: true,
        name: true,
        username: true,
        image: true,
        email: true,
        createdAt: true,
        role: true,
      },
    }),
    auth.api.getSession({ headers: await headers() }),
  ]);

  if (!profileUser) {
    notFound();
  }

  const isOwnProfile = session?.user?.id === profileUser.id;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <ProfileView
        profileUser={profileUser}
        isOwnProfile={isOwnProfile}
      />
    </Container>
  );
}

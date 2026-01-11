import prisma from "@/lib/prisma";
import UserManager from "./UserManager";
import { Box, Typography } from "@mui/material";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      image: true,
      role: true,
      isBanned: true,
      banReason: true,
      createdAt: true,
      _count: {
        select: {
          comments: true,
          submissions: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        จัดการผู้ใช้
      </Typography>
      <UserManager initialUsers={users} />
    </Box>
  );
}

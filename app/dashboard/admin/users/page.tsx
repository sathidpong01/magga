import { db } from "@/db";
import { profiles as usersTable, comments as commentsTable, mangaSubmissions as submissionsTable } from "@/db/schema";
import UserManager from "./UserManager";
import { Box, Typography } from "@mui/material";
import { eq, sql, desc } from "drizzle-orm";

export default async function UsersPage() {
  const usersQuery = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    username: usersTable.username,
    image: usersTable.image,
    role: usersTable.role,
    banned: usersTable.banned,
    banReason: usersTable.banReason,
    createdAt: usersTable.createdAt,
    commentsCount: sql<number>`count(distinct ${commentsTable.id})::int`,
    submissionsCount: sql<number>`count(distinct ${submissionsTable.id})::int`,
  })
    .from(usersTable)
    .leftJoin(commentsTable, eq(usersTable.id, commentsTable.userId))
    .leftJoin(submissionsTable, eq(usersTable.id, submissionsTable.userId))
    .groupBy(usersTable.id)
    .orderBy(desc(usersTable.createdAt));

  const users = usersQuery.map(user => ({
    ...user,
    _count: {
      comments: user.commentsCount,
      submissions: user.submissionsCount
    }
  }));

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        จัดการผู้ใช้
      </Typography>
      <UserManager initialUsers={users as any} />
    </Box>
  );
}

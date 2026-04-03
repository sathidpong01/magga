import { db } from "@/db";
import { profiles as usersTable, comments as commentsTable, mangaSubmissions as submissionsTable } from "@/db/schema";
import UserManager from "./UserManager";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { eq, sql, desc } from "drizzle-orm";

export default async function UsersPage() {
  const usersQuery = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    username: usersTable.username,
    image: usersTable.image,
    role: usersTable.role,
    banned: sql<boolean>`coalesce(${usersTable.banned}, ${usersTable.isBanned}, false)`,
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

  const admins = users.filter((user) => user.role === "admin").length;
  const suspended = users.filter((user) => user.banned).length;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
      }}
    >
      <Box
        sx={{
          borderRadius: 1.5,
          border: "1px solid rgba(255,255,255,0.06)",
          backgroundImage:
            "linear-gradient(180deg, rgba(251,191,36,0.06) 0%, rgba(20,20,20,0.92) 100%)",
          p: { xs: 2.25, md: 3 },
          boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Box sx={{ maxWidth: 720 }}>
            <Typography
              variant="overline"
              sx={{
                color: "#fbbf24",
                fontWeight: 800,
                letterSpacing: "0.14em",
                display: "block",
                mb: 0.5,
              }}
            >
              DASHBOARD / USERS
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                letterSpacing: "-0.03em",
                color: "#fafafa",
                mb: 0.75,
                fontSize: { xs: "1.8rem", md: "2.25rem" },
              }}
            >
              จัดการผู้ใช้
            </Typography>
            <Typography sx={{ color: "#a3a3a3", lineHeight: 1.7 }}>
              ดูสถานะผู้ใช้ แยกบทบาท จัดการการระงับบัญชี และไล่ตรวจ activity
              ได้ในมุมเดียวกับส่วนอื่นของ MAGGA
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label={`ทั้งหมด ${users.length}`} sx={{ bgcolor: "#171717", color: "#fafafa", border: "1px solid rgba(255,255,255,0.08)", fontWeight: 700 }} />
            <Chip label={`แอดมิน ${admins}`} sx={{ bgcolor: "rgba(251,191,36,0.08)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.18)", fontWeight: 700 }} />
            <Chip label={`ระงับ ${suspended}`} sx={{ bgcolor: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.18)", fontWeight: 700 }} />
          </Stack>
        </Stack>
      </Box>

      <UserManager initialUsers={users as any} />
    </Box>
  );
}

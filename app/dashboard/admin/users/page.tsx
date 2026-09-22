import { db } from "@/db";
import { profiles as usersTable, comments as commentsTable, mangaSubmissions as submissionsTable } from "@/db/schema";
import UserManager from "./UserManager";
import { alpha, Box, Chip, Stack, Typography } from "@mui/material";
import { eq, sql, desc } from "drizzle-orm";
import {
  DashboardSurface,
  dashboardTokens,
} from "@/app/components/dashboard/system";

export const dynamic = "force-dynamic";

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
      <DashboardSurface
        sx={{
          p: { xs: 2.25, md: 3 },
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" }
          }}>
          <Box sx={{ maxWidth: 720 }}>
            <Typography
              variant="overline"
              sx={{
                color: dashboardTokens.accent,
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
                color: dashboardTokens.text,
                mb: 0.75,
                fontSize: { xs: "1.8rem", md: "2.25rem" },
              }}
            >
              จัดการผู้ใช้
            </Typography>
            <Typography sx={{ color: dashboardTokens.textMuted, lineHeight: 1.7 }}>
              ดูสถานะผู้ใช้ แยกบทบาท จัดการการระงับบัญชี และไล่ตรวจ activity
              ได้ในมุมเดียวกับส่วนอื่นของ MAGGA
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} useFlexGap sx={{
            flexWrap: "wrap",
            alignItems: "center",
          }}>
            <Chip
              label={`ทั้งหมด ${users.length}`}
              sx={{
                bgcolor: dashboardTokens.surfaceMuted,
                color: dashboardTokens.text,
                border: `1px solid ${dashboardTokens.border}`,
                fontWeight: 700,
              }}
            />
            <Chip
              label={`แอดมิน ${admins}`}
              sx={{
                bgcolor: dashboardTokens.accentSoft,
                color: dashboardTokens.accent,
                border: `1px solid ${dashboardTokens.accentSoft}`,
                fontWeight: 700,
              }}
            />
            <Chip
              label={`ระงับ ${suspended}`}
              sx={{
                bgcolor: alpha(dashboardTokens.danger, 0.1),
                color: dashboardTokens.danger,
                border: `1px solid ${alpha(dashboardTokens.danger, 0.25)}`,
                fontWeight: 700,
              }}
            />
          </Stack>
        </Stack>
      </DashboardSurface>

      <UserManager initialUsers={users as any} />
    </Box>
  );
}

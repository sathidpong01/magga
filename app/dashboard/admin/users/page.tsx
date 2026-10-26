import AdminListControls from "@/app/components/dashboard/AdminListControls";
import { adminPageQuery, type AdminSearchParams } from "@/lib/admin-pagination";
import { readAdminUsers } from "@/lib/admin-lists";
import { requireAdminPage } from "@/lib/auth-helpers";
import type { Metadata } from "next";


import UserManager from "./UserManager";
import { alpha, Box, Chip, Stack, Typography } from "@mui/material";

import { DashboardSurface, dashboardTokens } from "@/app/components/dashboard/system";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "จัดการผู้ใช้ - MAGGA",
  description: "จัดการผู้ใช้และสิทธิ์บน MAGGA",
  openGraph: {
    title: "จัดการผู้ใช้ - MAGGA",
    description: "จัดการผู้ใช้และสิทธิ์บน MAGGA",
  },
  twitter: {
    title: "จัดการผู้ใช้ - MAGGA",
    description: "จัดการผู้ใช้และสิทธิ์บน MAGGA",
  },
};

export default async function UsersPage({
  searchParams,
}: { searchParams?: Promise<AdminSearchParams> } = {}) {
  await requireAdminPage();
  const query = adminPageQuery(await searchParams);
  const result = await readAdminUsers(query);
  const users = result.items;

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
            alignItems: { xs: "flex-start", md: "center" },
          }}
        >
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
            <Typography
              sx={{ color: dashboardTokens.textMuted, lineHeight: 1.7 }}
            >
              ดูสถานะผู้ใช้ แยกบทบาท จัดการการระงับบัญชี และไล่ตรวจ activity
              ได้ในมุมเดียวกับส่วนอื่นของ MAGGA
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Chip
              label={`ในหน้านี้ ${users.length}`}
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

      <AdminListControls
        query={query}
        hasMore={result.hasMore}
        count={users.length}
        sorts={[
          { value: "", label: "ล่าสุด" },
          { value: "name", label: "ชื่อ" },
        ]}
        statuses={[
          { value: "", label: "ทั้งหมด" },
          { value: "admin", label: "แอดมิน" },
          { value: "user", label: "สมาชิก" },
          { value: "banned", label: "ระงับ" },
        ]}
      />
      <UserManager initialUsers={users as any} />
    </Box>
  );
}

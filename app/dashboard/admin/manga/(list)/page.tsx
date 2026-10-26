import AdminListControls from "@/app/components/dashboard/AdminListControls";
import { adminPageQuery, type AdminSearchParams } from "@/lib/admin-pagination";
import { readAdminManga } from "@/lib/admin-lists";
import { requireAdminPage } from "@/lib/auth-helpers";
import type { Metadata } from "next";



import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import Link from "next/link";
import MangaDataTable from "../MangaDataTable";
import { DashboardSurface, dashboardTokens, dashboardPrimaryButtonSx } from "@/app/components/dashboard/system";

export const dynamic = "force-dynamic";

const ADMIN_MANGA_LIMIT = 200;
const ADMIN_METADATA_LIMIT = 500;

export const metadata: Metadata = {
  title: "จัดการมังงะ - MAGGA",
  description: "จัดการรายการมังงะบน MAGGA",
  openGraph: {
    title: "จัดการมังงะ - MAGGA",
    description: "จัดการรายการมังงะบน MAGGA",
  },
  twitter: {
    title: "จัดการมังงะ - MAGGA",
    description: "จัดการรายการมังงะบน MAGGA",
  },
};

export default async function AdminMangaPage({
  searchParams,
}: { searchParams?: Promise<AdminSearchParams> } = {}) {
  await requireAdminPage();
  const query = adminPageQuery(await searchParams);
  const result = await readAdminManga(query);
  const mangas = result.items;
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
              DASHBOARD / MANGA
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
              จัดการมังงะ
            </Typography>
            <Typography
              sx={{ color: dashboardTokens.textMuted, lineHeight: 1.7 }}
            >
              ค้นหาและจัดการมังงะ แก้ไขข้อมูลหรือสถานะได้จากรายการนี้
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
              label={`ในหน้านี้ ${mangas.length}`}
              sx={{
                bgcolor: dashboardTokens.surfaceMuted,
                color: dashboardTokens.text,
                border: `1px solid ${dashboardTokens.border}`,
                fontWeight: 700,
              }}
            />



            <Link
              href="/dashboard/admin/manga/create"
              style={{ textDecoration: "none" }}
            >
              <Button sx={dashboardPrimaryButtonSx}>+ เพิ่มมังงะใหม่</Button>
            </Link>
          </Stack>
        </Stack>
      </DashboardSurface>

      <AdminListControls
        query={query}
        hasMore={result.hasMore}
        count={mangas.length}
        sorts={[
          { value: "", label: "ล่าสุด" },
          { value: "title", label: "ชื่อเรื่อง" },
          { value: "views", label: "ยอดอ่าน" },
        ]}
        statuses={[
          { value: "", label: "ทั้งหมด" },
          { value: "published", label: "เผยแพร่" },
          { value: "hidden", label: "ซ่อน" },
        ]}
      />
      <MangaDataTable
        initialMangas={mangas}
      />
    </Box>
  );
}

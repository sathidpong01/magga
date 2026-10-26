import AdminListControls from "@/app/components/dashboard/AdminListControls";
import { adminPageQuery, pageSlice, escapeLike, type AdminSearchParams } from "@/lib/admin-pagination";
import { ilike } from "drizzle-orm";
import { requireAdminPage } from "@/lib/auth-helpers";
import type { Metadata } from "next";
import { db } from "@/db";
import { authors as authorsTable } from "@/db/schema";
import { asc } from "drizzle-orm";
import AuthorManager from "./AuthorManager";
import { Box, Typography } from "@mui/material";
import { dashboardTokens } from "@/app/components/dashboard/system";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "จัดการผู้แต่ง - MAGGA",
  description: "จัดการข้อมูลผู้แต่งและเครดิตบน MAGGA",
  openGraph: {
    title: "จัดการผู้แต่ง - MAGGA",
    description: "จัดการข้อมูลผู้แต่งและเครดิตบน MAGGA",
  },
  twitter: {
    title: "จัดการผู้แต่ง - MAGGA",
    description: "จัดการข้อมูลผู้แต่งและเครดิตบน MAGGA",
  },
};

export default async function AuthorsPage({
  searchParams,
}: { searchParams?: Promise<AdminSearchParams> } = {}) {
  await requireAdminPage();
  const query = adminPageQuery(await searchParams);
  const rows = await db.query.authors.findMany({
    where: query.search
      ? ilike(authorsTable.name, `%${escapeLike(query.search)}%`)
      : undefined,
    orderBy: [asc(authorsTable.name), asc(authorsTable.id)],
    limit: query.limit + 1,
    offset: (query.page - 1) * query.limit,
  });

  const result = pageSlice(rows, query);
  const authors = result.items;
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            letterSpacing: "-0.03em",
            color: dashboardTokens.text,
            mb: 0.75,
          }}
        >
          จัดการผู้แต่ง
        </Typography>
        <Typography sx={{ color: dashboardTokens.textMuted }}>
          ดู เพิ่ม แก้ไข และลบข้อมูลผู้แต่งในรูปแบบ workspace เดียวกัน
        </Typography>
      </Box>
      <AdminListControls
        query={query}
        hasMore={result.hasMore}
        count={authors.length}
      />
      <AuthorManager initialAuthors={authors as any} />
    </Box>
  );
}

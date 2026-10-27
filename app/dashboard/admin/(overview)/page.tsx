import { readAdminOverview, boundedAdminCount } from "@/lib/admin-overview";
import { readViewSummaries } from "@/lib/admin-view-history";
import MangaViewHistory from "@/app/components/dashboard/MangaViewHistory";
import { requireAdminPage } from "@/lib/auth-helpers";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/auth-helpers";
import { db } from "@/db";
import { manga as mangaTable } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Box, Typography, Grid } from "@mui/material";
import CategoryIcon from "@mui/icons-material/Category";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import PeopleIcon from "@mui/icons-material/People";
import CommentIcon from "@mui/icons-material/Comment";
import EditNoteIcon from "@mui/icons-material/EditNote";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import AssignmentIcon from "@mui/icons-material/Assignment";
import Link from "next/link";
import Image from "next/image";
import { maggaColors } from "@/lib/design-tokens";
import { DashboardPageHeader, DashboardStat, DashboardSurface } from "@/app/components/dashboard/system";
import { overviewCardSx, overviewCoverSx, overviewRankSx } from "@/app/components/dashboard/overview-layout";

// Dynamic rendering for real-time data
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ภาพรวมผู้ดูแล - MAGGA",
  description: "ภาพรวมการจัดการเนื้อหาและชุมชน MAGGA",
  openGraph: {
    title: "ภาพรวมผู้ดูแล - MAGGA",
    description: "ภาพรวมการจัดการเนื้อหาและชุมชน MAGGA",
  },
  twitter: {
    title: "ภาพรวมผู้ดูแล - MAGGA",
    description: "ภาพรวมการจัดการเนื้อหาและชุมชน MAGGA",
  },
};

export default async function AdminPage() {
  await requireAdminPage();
  const session = await auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  });
  if (!isAdminRole(session)) {
    redirect("/auth/signin?callbackUrl=/dashboard/admin");
  }

  const [counts, topManga] = await Promise.all([
    readAdminOverview(),
    db
      .select({
        id: mangaTable.id,
        title: mangaTable.title,
        slug: mangaTable.slug,
        viewCount: mangaTable.viewCount,
        coverImage: mangaTable.coverImage,
      })
      .from(mangaTable)
      .where(eq(mangaTable.isHidden, false))
      .orderBy(desc(mangaTable.viewCount), desc(mangaTable.id))
      .limit(10),
  ]);
  const viewHistory = await readViewSummaries(topManga.map(manga => manga.id));
  const totalManga = boundedAdminCount(counts.manga),
    totalCategories = boundedAdminCount(counts.categories),
    totalTags = boundedAdminCount(counts.tags),
    draftManga = boundedAdminCount(counts.drafts),
    totalUsers = boundedAdminCount(counts.users),
    totalComments = boundedAdminCount(counts.comments),
    pendingSubmissions = boundedAdminCount(counts.pending);

  const stats = [
    { label: "มังงะทั้งหมด", value: totalManga, icon: <AutoStoriesIcon />, href: "/dashboard/admin/manga" },
    { label: "ฉบับร่าง", value: draftManga, icon: <EditNoteIcon />, href: "/dashboard/admin/manga?status=hidden" },
    { label: "รายการรอตรวจ", value: pendingSubmissions, icon: <AssignmentIcon />, href: "/dashboard/admin/submissions?status=PENDING" },
    { label: "ผู้ใช้ทั้งหมด", value: totalUsers, icon: <PeopleIcon />, href: "/dashboard/admin/users" },
    { label: "คอมเมนต์", value: totalComments, icon: <CommentIcon />, href: "/dashboard/admin/comments" },
    { label: "หมวดหมู่", value: totalCategories, icon: <CategoryIcon />, href: "/dashboard/admin/metadata" },
    { label: "แท็ก", value: totalTags, icon: <LocalOfferIcon />, href: "/dashboard/admin/metadata?tab=tags" },
  ];
  const queue = [
    { label: "ฝากลงรอตรวจ", value: pendingSubmissions, href: "/dashboard/admin/submissions?status=PENDING" },
    { label: "รายงานคอมเมนต์", value: boundedAdminCount(counts.reports), href: "/dashboard/admin/comments?reports=open" },
    { label: "ข้อเสนอ MCP", value: boundedAdminCount(counts.proposals), href: "/dashboard/admin/mcp-drafts?status=pending" },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }} data-overview>
      <DashboardPageHeader eyebrow="ADMIN WORKSPACE" title="ภาพรวมการดูแลระบบ" sx={{ mb: 0, "& h1": { fontSize: "1.75rem" } }} />
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 }, flexWrap: "wrap", minHeight: 40 }}>
        <Typography variant="body2" sx={{ color: maggaColors.textSecondary }}>งานรอดำเนินการ</Typography>
        {queue.map(item => <Link key={item.label} href={item.href} prefetch={false} style={{ textDecoration: "none" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minHeight: 40, px: 1.25, borderRadius: 1, bgcolor: maggaColors.surface, border: `1px solid ${maggaColors.border}`, "&:hover": { borderColor: maggaColors.archiveGold } }}>
            <Typography variant="body2" sx={{ color: maggaColors.textSecondary }}>{item.label}</Typography>
            <Typography sx={{ color: maggaColors.archiveGoldHover, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{item.value}</Typography>
          </Box>
        </Link>)}
      </Box>
      <Grid data-overview-kpis container spacing={1} columns={{ xs: 12, sm: 12, lg: 7 }}>
        {stats.map((stat, index) => <Grid key={stat.label} size={{ xs: index === 6 ? 12 : 6, sm: index >= 4 ? 4 : 3, lg: 1 }}>
          <DashboardStat {...stat} compact />
        </Grid>)}
      </Grid>
      <Grid container spacing={1.5} sx={{ alignItems: "flex-start" }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <DashboardSurface sx={{ p: 1.25 }}>
            <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1, mb: 1 }}>
              <Typography component="h2" sx={{ fontWeight: 700, fontSize: "1rem" }}>เรื่องยอดนิยม 3 อันดับแรก</Typography>
              <Typography variant="caption" sx={{ color: maggaColors.textSecondary, whiteSpace: "nowrap" }}>ยอดอ่านสะสม</Typography>
            </Box>
            <Grid container spacing={1.25}>
              {topManga.slice(0, 3).map((manga, index) => <Grid key={manga.id} size={{ xs: 12, sm: 4 }} sx={{ minWidth: 0 }}>
                <Box sx={overviewCardSx}>
                  <Link href={`/${manga.slug || manga.id}`} prefetch={false} style={{ textDecoration: "none", display: "block", minWidth: 0 }}>
                    <Box data-overview-cover sx={overviewCoverSx}>
                      {manga.coverImage ? <Image src={manga.coverImage} alt={manga.title} fill sizes="(max-width: 600px) 240px, 20vw" style={{ objectFit: "cover" }} /> : null}
                      <Box sx={{ position: "absolute", top: 8, left: 8, px: 0.75, height: 26, display: "flex", alignItems: "center", borderRadius: 1, bgcolor: maggaColors.background, color: maggaColors.archiveGoldHover, fontWeight: 800, fontSize: "0.8rem" }}>#{index + 1}</Box>
                    </Box>
                    <Typography component="h3" title={manga.title} noWrap sx={{ color: maggaColors.textPrimary, fontWeight: 600, fontSize: "0.85rem", lineHeight: "20px", minHeight: 20, mt: 0.75 }}>{manga.title}</Typography>
                    <Typography sx={{ color: maggaColors.archiveGoldHover, fontWeight: 700, fontSize: "0.8rem", lineHeight: "20px", fontVariantNumeric: "tabular-nums" }}>{manga.viewCount?.toLocaleString() || 0} ครั้ง</Typography>
                  </Link>
                  <Box sx={{ mt: 0.5, pt: 0.5, borderTop: `1px solid ${maggaColors.border}` }}>
                    <MangaViewHistory id={manga.id} title={manga.title} initial={viewHistory[manga.id]} />
                  </Box>
                </Box>
              </Grid>)}
            </Grid>
          </DashboardSurface>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <DashboardSurface sx={{ p: 1.25 }}>
            <Typography component="h2" sx={{ fontWeight: 700, fontSize: "1rem", mb: 1 }}>อันดับ 4–10</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {topManga.slice(3).map((manga, index) => <Box key={manga.id} data-overview-ranking sx={overviewRankSx}>
                <Link href={`/${manga.slug || manga.id}`} prefetch={false} style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0, textDecoration: "none" }}>
                  <Typography sx={{ color: maggaColors.textSecondary, width: 24, flexShrink: 0, fontSize: "0.75rem", fontWeight: 700 }}>#{index + 4}</Typography>
                  <Box sx={{ position: "relative", width: 30, height: 40, flexShrink: 0, overflow: "hidden", borderRadius: 1, bgcolor: maggaColors.background }}>
                    {manga.coverImage ? <Image src={manga.coverImage} alt={manga.title} fill sizes="30px" style={{ objectFit: "cover" }} /> : null}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography title={manga.title} noWrap sx={{ color: maggaColors.textPrimary, fontWeight: 600, fontSize: "0.8rem", lineHeight: "18px" }}>{manga.title}</Typography>
                    <Typography sx={{ color: maggaColors.textSecondary, fontSize: "0.75rem", lineHeight: "18px", fontVariantNumeric: "tabular-nums" }}>{manga.viewCount?.toLocaleString() || 0} ครั้ง</Typography>
                  </Box>
                </Link>
                <Box sx={{ width: { xs: 108, sm: 128 }, flexShrink: 0 }}>
                  <MangaViewHistory id={manga.id} title={manga.title} initial={viewHistory[manga.id]} />
                </Box>
              </Box>)}
            </Box>
          </DashboardSurface>
        </Grid>
      </Grid>
    </Box>
  );
}

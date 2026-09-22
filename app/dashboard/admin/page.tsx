import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/auth-helpers";
import { db } from "@/db";
import {
  manga as mangaTable,
  categories as categoriesTable,
  tags as tagsTable,
  profiles as usersTable,
  comments as commentsTable,
  mangaSubmissions as submissionsTable
} from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Box, Typography, Grid, Divider, Stack } from "@mui/material";
import CategoryIcon from "@mui/icons-material/Category";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import PeopleIcon from "@mui/icons-material/People";
import CommentIcon from "@mui/icons-material/Comment";
import EditNoteIcon from "@mui/icons-material/EditNote";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import AssignmentIcon from "@mui/icons-material/Assignment";
import Link from "next/link";
import Image from "next/image";
import {
  DashboardPageHeader,
  DashboardSectionTitle,
  DashboardStat,
  DashboardSurface,
  dashboardInsetSurfaceSx,
  dashboardTokens,
} from "@/app/components/dashboard/system";

// Dynamic rendering for real-time data
export const dynamic = "force-dynamic";

const COUNT_SAMPLE_LIMIT = 1000;

function displayBoundedCount(rows: unknown[]) {
  return rows.length >= COUNT_SAMPLE_LIMIT ? `${COUNT_SAMPLE_LIMIT}+` : rows.length;
}

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdminRole(session)) {
    redirect("/auth/signin?callbackUrl=/dashboard/admin");
  }

  const [
    totalMangaRows,
    totalCategoriesRows,
    totalTagsRows,
    draftMangaRows,
    totalUsersRows,
    totalCommentsRows,
    pendingSubmissionsRows,
    topManga,
  ] = await Promise.all([
    db.select({ id: mangaTable.id }).from(mangaTable).limit(COUNT_SAMPLE_LIMIT),
    db.select({ id: categoriesTable.id }).from(categoriesTable).limit(COUNT_SAMPLE_LIMIT),
    db.select({ id: tagsTable.id }).from(tagsTable).limit(COUNT_SAMPLE_LIMIT),
    db
      .select({ id: mangaTable.id })
      .from(mangaTable)
      .where(eq(mangaTable.isHidden, true))
      .limit(COUNT_SAMPLE_LIMIT),
    db.select({ id: usersTable.id }).from(usersTable).limit(COUNT_SAMPLE_LIMIT),
    db.select({ id: commentsTable.id }).from(commentsTable).limit(COUNT_SAMPLE_LIMIT),
    db
      .select({ id: submissionsTable.id })
      .from(submissionsTable)
      .where(eq(submissionsTable.status, "PENDING"))
      .limit(COUNT_SAMPLE_LIMIT),
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
      .orderBy(desc(mangaTable.viewCount))
      .limit(10),
  ]);

  const totalManga = displayBoundedCount(totalMangaRows);
  const totalCategories = displayBoundedCount(totalCategoriesRows);
  const totalTags = displayBoundedCount(totalTagsRows);
  const draftManga = displayBoundedCount(draftMangaRows);
  const totalUsers = displayBoundedCount(totalUsersRows);
  const totalComments = displayBoundedCount(totalCommentsRows);
  const pendingSubmissions = displayBoundedCount(pendingSubmissionsRows);

  const rankedManga = topManga.map((manga) => ({
    ...manga,
    uniqueVisitors: null as number | null,
  }));

  return (
    <Box>
      <DashboardPageHeader
        eyebrow="ADMIN WORKSPACE"
        title="ภาพรวมการดูแลระบบ"
        description="สรุปภาพรวมของมังงะ ผู้ใช้ คอมเมนต์ และรายการฝากลง เพื่อให้ตัดสินใจและจัดการงานประจำวันได้จากหน้าเดียว"
        sx={{ mb: 2 }}
      />

      {/* Stats Grid: Single row on desktop (7 columns), responsive on mobile */}
      <Grid container spacing={1.5} columns={{ xs: 12, sm: 12, md: 12, lg: 7 }} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 6, sm: 3, md: 3, lg: 1 }}>
          <DashboardStat
            label="มังงะทั้งหมด"
            value={totalManga}
            icon={<AutoStoriesIcon />}
            href="/dashboard/admin/manga"
            compact
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 3, lg: 1 }}>
          <DashboardStat
            label="ฉบับร่าง"
            value={draftManga}
            icon={<EditNoteIcon />}
            href="/dashboard/admin/manga"
            compact
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 3, lg: 1 }}>
          <DashboardStat
            label="รายการรอตรวจ"
            value={pendingSubmissions}
            icon={<AssignmentIcon />}
            href="/dashboard/admin/submissions"
            compact
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 3, lg: 1 }}>
          <DashboardStat
            label="ผู้ใช้ทั้งหมด"
            value={totalUsers}
            icon={<PeopleIcon />}
            href="/dashboard/admin/users"
            compact
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 4, lg: 1 }}>
          <DashboardStat
            label="คอมเมนต์"
            value={totalComments}
            icon={<CommentIcon />}
            href="/dashboard/admin/comments"
            compact
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 4, lg: 1 }}>
          <DashboardStat
            label="หมวดหมู่"
            value={totalCategories}
            icon={<CategoryIcon />}
            href="/dashboard/admin/metadata"
            compact
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4, md: 4, lg: 1 }}>
          <DashboardStat
            label="แท็ก"
            value={totalTags}
            icon={<LocalOfferIcon />}
            href="/dashboard/admin/metadata"
            compact
          />
        </Grid>
      </Grid>

      {/* Popular Manga: Side-by-side Top 3 (Left) & Top 4-10 (Right) to fit in one screen */}
      <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
        {/* Left: Top 3 Manga */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <DashboardSurface sx={{ p: { xs: 2, md: 2.25 }, height: "100%", display: "flex", flexDirection: "column" }}>
            <DashboardSectionTitle
              title="เรื่องยอดนิยม 3 อันดับแรก"
              description="จัดอันดับจากยอดอ่านสะสม"
            />

            <Grid container spacing={1.5} sx={{ flex: 1, alignItems: "stretch" }}>
              {rankedManga.slice(0, 3).map((manga, index) => (
                <Grid key={manga.id} size={{ xs: 12, sm: 4 }}>
                  <Link href={`/${manga.slug || manga.id}`} prefetch={false} style={{ textDecoration: "none", display: "block", height: "100%" }}>
                    <Box
                      sx={{
                        ...dashboardInsetSurfaceSx,
                        p: 1.25,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: "10px",
                        transition: "border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          borderColor: "rgba(217, 119, 6, 0.35)",
                          bgcolor: dashboardTokens.surfaceAlt,
                          boxShadow: "0 8px 20px -4px rgba(0, 0, 0, 0.45)",
                        },
                      }}
                    >
                      <Box sx={{ position: "relative", mb: 1 }}>
                        <Box
                          sx={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            zIndex: 2,
                            minWidth: 26,
                            height: 26,
                            px: 0.75,
                            borderRadius: "5px",
                            bgcolor: index === 0 ? dashboardTokens.accent : "rgba(20, 20, 22, 0.85)",
                            backdropFilter: index === 0 ? undefined : "blur(8px)",
                            color: index === 0 ? "#120d00" : dashboardTokens.text,
                            border: index === 0 ? "none" : "1px solid rgba(255,255,255,0.12)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "0.8rem",
                            fontVariantNumeric: "tabular-nums",
                            boxShadow: "0 4px 10px rgba(0,0,0,0.35)",
                          }}
                        >
                          #{index + 1}
                        </Box>
                        <Box
                          sx={{
                            position: "relative",
                            width: "100%",
                            aspectRatio: "3 / 4",
                            maxHeight: { xs: 260, md: 220, xl: 250 },
                            overflow: "hidden",
                            borderRadius: "8px",
                            bgcolor: dashboardTokens.surfaceMuted,
                          }}
                        >
                          {manga.coverImage ? (
                            <Image
                              src={manga.coverImage}
                              alt={manga.title}
                              fill
                              sizes="(max-width: 900px) 100vw, 25vw"
                              style={{ objectFit: "cover" }}
                            />
                          ) : null}
                          <Box
                            sx={{
                              position: "absolute",
                              inset: 0,
                              background:
                                "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.85) 100%)",
                            }}
                          />
                        </Box>
                      </Box>

                      <Typography
                        component="h3"
                        sx={{
                          color: dashboardTokens.text,
                          fontWeight: 600,
                          fontSize: "0.88rem",
                          lineHeight: 1.3,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {manga.title}
                      </Typography>
                      <Typography
                        sx={{
                          color: dashboardTokens.accent,
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          fontVariantNumeric: "tabular-nums",
                          mt: 0.5,
                        }}
                      >
                        {manga.viewCount?.toLocaleString() || 0} ครั้ง
                      </Typography>
                      <Typography sx={{ color: dashboardTokens.textMuted, fontSize: "0.75rem", mt: 0.25 }}>
                        ผู้ชมไม่ซ้ำ {manga.uniqueVisitors?.toLocaleString() ?? "—"}
                      </Typography>
                    </Box>
                  </Link>
                </Grid>
              ))}
            </Grid>
          </DashboardSurface>
        </Grid>

        {/* Right: Top 4-10 Manga */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <DashboardSurface sx={{ p: { xs: 2, md: 2.25 }, height: "100%", display: "flex", flexDirection: "column" }}>
            <DashboardSectionTitle
              title="อันดับ 4 - 10"
              description="เรื่องที่มีการเข้าชมต่อเนื่อง"
            />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, flex: 1, justifyContent: "space-between" }}>
              {rankedManga.slice(3).map((manga, index) => (
                <Link
                  key={manga.id}
                  href={`/${manga.slug || manga.id}`}
                  prefetch={false}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1.25,
                      px: 1.25,
                      py: 0.65,
                      borderRadius: "8px",
                      ...dashboardInsetSurfaceSx,
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        bgcolor: dashboardTokens.surfaceAlt,
                        borderColor: "rgba(217, 119, 6, 0.25)",
                        transform: "translateX(3px)",
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          width: 26,
                          fontWeight: 700,
                          fontSize: "0.82rem",
                          color: index === 0 ? dashboardTokens.accent : dashboardTokens.textMuted,
                          textAlign: "center",
                          fontVariantNumeric: "tabular-nums",
                          flexShrink: 0,
                        }}
                      >
                        #{index + 4}
                      </Typography>
                      <Box
                        sx={{
                          position: "relative",
                          width: 32,
                          height: 42,
                          borderRadius: "4px",
                          overflow: "hidden",
                          bgcolor: dashboardTokens.surfaceMuted,
                          flexShrink: 0,
                        }}
                      >
                        {manga.coverImage ? (
                          <Image
                            src={manga.coverImage}
                            alt={manga.title}
                            fill
                            sizes="64px"
                            style={{ objectFit: "cover" }}
                          />
                        ) : null}
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.82rem",
                          color: dashboardTokens.text,
                          minWidth: 0,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {manga.title}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: dashboardTokens.accent, fontSize: "0.82rem", lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}>
                        {manga.viewCount?.toLocaleString() || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: dashboardTokens.textMuted, fontSize: "0.75rem", display: "block" }}>
                        ผู้ชม {manga.uniqueVisitors?.toLocaleString() ?? "—"}
                      </Typography>
                    </Box>
                  </Box>
                </Link>
              ))}
            </Box>
          </DashboardSurface>
        </Grid>
      </Grid>
    </Box>
  );
}

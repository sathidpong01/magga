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
      />

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4.5 }}>
        {/* Row 1: Core Operations */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardStat
            label="มังงะทั้งหมด"
            value={totalManga}
            icon={<AutoStoriesIcon />}
            href="/dashboard/admin/manga"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardStat
            label="ฉบับร่าง"
            value={draftManga}
            icon={<EditNoteIcon />}
            href="/dashboard/admin/manga"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardStat
            label="รายการรอตรวจ"
            value={pendingSubmissions}
            icon={<AssignmentIcon />}
            href="/dashboard/admin/submissions"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardStat
            label="ผู้ใช้ทั้งหมด"
            value={totalUsers}
            icon={<PeopleIcon />}
            href="/dashboard/admin/users"
          />
        </Grid>

        {/* Row 2: Community & Metadata */}
        <Grid size={{ xs: 12, sm: 4, md: 4 }}>
          <DashboardStat
            label="คอมเมนต์ทั้งหมด"
            value={totalComments}
            icon={<CommentIcon />}
            href="/dashboard/admin/comments"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 4 }}>
          <DashboardStat
            label="หมวดหมู่"
            value={totalCategories}
            icon={<CategoryIcon />}
            href="/dashboard/admin/metadata"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 4 }}>
          <DashboardStat
            label="แท็ก"
            value={totalTags}
            icon={<LocalOfferIcon />}
            href="/dashboard/admin/metadata"
          />
        </Grid>
      </Grid>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 4 }} />

      {/* Top 10 Popular Manga */}
      <DashboardSurface sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <DashboardSectionTitle
          title="เรื่องที่ถูกอ่านมากที่สุด"
          description="จัดอันดับจากยอดอ่านสะสม เพื่อให้เห็นเรื่องที่ควรตรวจและดูแลก่อน"
        />

        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {rankedManga.slice(0, 3).map((manga, index) => (
            <Grid key={manga.id} size={{ xs: 12, sm: 4 }}>
              <Link href={`/${manga.slug || manga.id}`} prefetch={false} style={{ textDecoration: "none", display: "block" }}>
                <Box
                  sx={{
                    ...dashboardInsetSurfaceSx,
                    p: 1.75,
                    height: "100%",
                    borderRadius: "12px",
                    transition: "border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-3px)",
                      borderColor: "rgba(217, 119, 6, 0.35)",
                      bgcolor: dashboardTokens.surfaceAlt,
                      boxShadow: "0 10px 28px -4px rgba(0, 0, 0, 0.45)",
                    },
                  }}
                >
                  <Box sx={{ position: "relative", mb: 1.5 }}>
                    <Box
                      sx={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        zIndex: 2,
                        minWidth: 28,
                        height: 28,
                        px: 1,
                        borderRadius: "6px",
                        bgcolor: index === 0 ? dashboardTokens.accent : "rgba(20, 20, 22, 0.85)",
                        backdropFilter: index === 0 ? undefined : "blur(8px)",
                        color: index === 0 ? "#120d00" : dashboardTokens.text,
                        border: index === 0 ? "none" : "1px solid rgba(255,255,255,0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        fontVariantNumeric: "tabular-nums",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
                      }}
                    >
                      #{index + 1}
                    </Box>
                    <Box
                      sx={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "3 / 4",
                        overflow: "hidden",
                        borderRadius: "10px",
                        bgcolor: dashboardTokens.surfaceMuted,
                      }}
                    >
                      {manga.coverImage ? (
                        <Image
                          src={manga.coverImage}
                          alt={manga.title}
                          fill
                          sizes="(max-width: 900px) 100vw, 30vw"
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
                    variant="caption"
                    sx={{
                      color: dashboardTokens.accent,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      display: "block",
                      mb: 0.5,
                      textTransform: "uppercase",
                      fontSize: "0.75rem",
                    }}
                  >
                    อันดับ {index + 1}
                  </Typography>
                  <Typography
                    sx={{
                      color: dashboardTokens.text,
                      fontWeight: 700,
                      fontSize: "1rem",
                      lineHeight: 1.35,
                      mb: 1,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {manga.title}
                  </Typography>
                  <Typography
                    sx={{
                      color: dashboardTokens.accent,
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {manga.viewCount?.toLocaleString() || 0} ครั้ง
                  </Typography>
                  <Typography sx={{ color: dashboardTokens.textMuted, fontSize: "0.78rem", mt: 0.3 }}>
                    ผู้ชมไม่ซ้ำ {manga.uniqueVisitors?.toLocaleString() ?? "—"}
                  </Typography>
                </Box>
              </Link>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
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
                  gap: 2,
                  p: 1.5,
                  borderRadius: "10px",
                  ...dashboardInsetSurfaceSx,
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: dashboardTokens.surfaceAlt,
                    borderColor: "rgba(217, 119, 6, 0.25)",
                    transform: "translateX(4px)",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.75, minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      width: 32,
                      fontWeight: 700,
                      fontSize: "0.95rem",
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
                      width: 45,
                      height: 60,
                      borderRadius: "6px",
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
                        sizes="90px"
                        style={{ objectFit: "cover" }}
                      />
                    ) : null}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      color: dashboardTokens.text,
                      minWidth: 0,
                      display: "-webkit-box",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      lineHeight: 1.4,
                    }}
                  >
                    {manga.title}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: dashboardTokens.accent, lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}>
                    {manga.viewCount?.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: dashboardTokens.textMuted, fontSize: "0.72rem", display: "block", mt: 0.25 }}>
                    ผู้ชม {manga.uniqueVisitors?.toLocaleString() ?? "—"}
                  </Typography>
                </Box>
              </Box>
            </Link>
          ))}
        </Box>
      </DashboardSurface>
    </Box>
  );
}

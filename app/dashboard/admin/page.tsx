import { db } from "@/db";
import { 
  manga as mangaTable,
  mangaViews as mangaViewsTable,
  categories as categoriesTable,
  tags as tagsTable,
  profiles as usersTable,
  comments as commentsTable,
  mangaSubmissions as submissionsTable
} from "@/db/schema";
import { count, eq, sum, desc, inArray } from "drizzle-orm";
import { Box, Typography, Grid, Divider, Stack } from "@mui/material";
import CategoryIcon from "@mui/icons-material/Category";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import PeopleIcon from "@mui/icons-material/People";
import CommentIcon from "@mui/icons-material/Comment";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditNoteIcon from "@mui/icons-material/EditNote";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import AssignmentIcon from "@mui/icons-material/Assignment";
import InsightsIcon from "@mui/icons-material/Insights";
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

export default async function AdminPage() {
  // Stats
  const [{ count: totalManga }] = await db.select({ count: count() }).from(mangaTable);
  const [{ count: totalCategories }] = await db.select({ count: count() }).from(categoriesTable);
  const [{ count: totalTags }] = await db.select({ count: count() }).from(tagsTable);
  const [{ count: draftManga }] = await db.select({ count: count() }).from(mangaTable).where(eq(mangaTable.isHidden, true));
  const [{ count: totalUsers }] = await db.select({ count: count() }).from(usersTable);
  const [{ count: totalComments }] = await db.select({ count: count() }).from(commentsTable);
  const [{ count: pendingSubmissions }] = await db.select({ count: count() }).from(submissionsTable).where(eq(submissionsTable.status, "PENDING"));

  // Total reads and unique visitors across all manga
  const [{ totalViewsAgg }] = await db.select({ totalViewsAgg: sum(mangaTable.viewCount) }).from(mangaTable);
  const totalViews = Number(totalViewsAgg || 0);
  const [{ totalUniqueVisitors }] = await db
    .select({ totalUniqueVisitors: count() })
    .from(mangaViewsTable);

  // Top 10 Popular Manga by total reads
  const topManga = await db.query.manga.findMany({
    where: eq(mangaTable.isHidden, false),
    orderBy: [desc(mangaTable.viewCount)],
    limit: 10,
    columns: {
      id: true,
      title: true,
      slug: true,
      viewCount: true,
      coverImage: true,
    },
  });
  const topMangaIds = topManga.map((manga) => manga.id);
  const uniqueVisitorRows = topMangaIds.length
    ? await db
        .select({
          mangaId: mangaViewsTable.mangaId,
          uniqueVisitors: count(),
        })
        .from(mangaViewsTable)
        .where(inArray(mangaViewsTable.mangaId, topMangaIds))
        .groupBy(mangaViewsTable.mangaId)
    : [];
  const uniqueVisitorMap = new Map(
    uniqueVisitorRows.map((row) => [row.mangaId, row.uniqueVisitors])
  );
  const rankedManga = topManga.map((manga) => ({
    ...manga,
    uniqueVisitors: uniqueVisitorMap.get(manga.id) ?? 0,
  }));

  return (
    <Box>
      <DashboardPageHeader
        eyebrow="ADMIN WORKSPACE"
        title="ภาพรวมการดูแลระบบ"
        description="สรุปภาพรวมของมังงะ ผู้ใช้ คอมเมนต์ และรายการฝากลง เพื่อให้ตัดสินใจและจัดการงานประจำวันได้จากหน้าเดียว"
      />

      {/* Stats Grid */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
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
            label="ผู้ใช้ทั้งหมด"
            value={totalUsers}
            icon={<PeopleIcon />}
            href="/dashboard/admin/users"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardStat
            label="คอมเมนต์ทั้งหมด"
            value={totalComments}
            icon={<CommentIcon />}
            href="/dashboard/admin/comments"
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
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <DashboardStat
            label="ฉบับร่าง"
            value={draftManga}
            icon={<EditNoteIcon />}
            href="/dashboard/admin/manga"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <DashboardStat
            label="อ่านสะสม"
            value={totalViews}
            icon={<VisibilityIcon />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <DashboardStat
            label="ผู้ชมแยกเรื่อง"
            value={totalUniqueVisitors}
            icon={<InsightsIcon />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <DashboardStat
            label="หมวดหมู่"
            value={totalCategories}
            icon={<CategoryIcon />}
            href="/dashboard/admin/metadata"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <DashboardStat
            label="แท็ก"
            value={totalTags}
            icon={<LocalOfferIcon />}
            href="/dashboard/admin/metadata"
          />
        </Grid>
      </Grid>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 3.5 }} />

      {/* Top 10 Popular Manga */}
      <DashboardSurface sx={{ p: { xs: 2.5, md: 3 } }}>
        <DashboardSectionTitle
          title="เรื่องที่ถูกอ่านมากที่สุด"
          description="จัดอันดับจากยอดอ่านสะสม พร้อมผู้ชมไม่ซ้ำรายเรื่องจากคีย์ผู้เยี่ยมชมฝั่งเบราว์เซอร์ เพื่ออ่านแนวโน้มได้แม่นขึ้นกว่าเดิม"
        />

        <Grid container spacing={2.25} sx={{ mb: 2.25 }}>
          {rankedManga.slice(0, 3).map((manga, index) => (
            <Grid key={manga.id} size={{ xs: 12, sm: 4 }}>
              <Link href={`/${manga.slug || manga.id}`} style={{ textDecoration: "none", display: "block" }}>
                <Box
                  sx={{
                    ...dashboardInsetSurfaceSx,
                    p: 1.1,
                    height: "100%",
                    transition: "transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-3px)",
                      borderColor: "rgba(251,191,36,0.28)",
                      bgcolor: "#1b1b1b",
                    },
                  }}
                >
                  <Box sx={{ position: "relative", mb: 1.25 }}>
                    <Box
                      sx={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        zIndex: 2,
                        minWidth: 34,
                        height: 34,
                        px: 1,
                        borderRadius: 0.9,
                        bgcolor: index === 0 ? dashboardTokens.accent : "rgba(10,10,10,0.88)",
                        color: index === 0 ? "#120d00" : "#fafafa",
                        border: index === 0 ? "none" : "1px solid rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        fontSize: "0.95rem",
                        boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Box
                      sx={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "2 / 3",
                        overflow: "hidden",
                        borderRadius: 1,
                        bgcolor: "#0b0b0b",
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
                            "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.14) 45%, rgba(0,0,0,0.82) 100%)",
                        }}
                      />
                    </Box>
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{
                      color: dashboardTokens.textSoft,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      display: "block",
                      mb: 0.7,
                    }}
                  >
                    อันดับ {index + 1}
                  </Typography>
                  <Typography
                    sx={{
                      color: dashboardTokens.text,
                      fontWeight: 800,
                      lineHeight: 1.25,
                      minHeight: { xs: "auto", sm: 48 },
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
                      fontWeight: 800,
                      mt: 0.8,
                      fontSize: "0.95rem",
                    }}
                  >
                    {manga.viewCount?.toLocaleString() || 0} ครั้ง
                  </Typography>
                  <Typography sx={{ color: dashboardTokens.textSoft, fontSize: "0.78rem", mt: 0.3 }}>
                    ผู้ชมไม่ซ้ำ {manga.uniqueVisitors.toLocaleString()}
                  </Typography>
                </Box>
              </Link>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.85 }}>
          {rankedManga.slice(3).map((manga, index) => (
            <Link
              key={manga.id}
              href={`/${manga.slug || manga.id}`}
              style={{ textDecoration: "none", display: "block" }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.5,
                  p: 1.2,
                  ...dashboardInsetSurfaceSx,
                  textDecoration: "none",
                  transition: "all 0.2s",
                  "&:hover": {
                    bgcolor: "#1c1c1c",
                    borderColor: "rgba(255,255,255,0.12)",
                    transform: "translateX(4px)",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      width: 34,
                      fontWeight: 900,
                      color: index === 0 ? dashboardTokens.accent : "#64748b",
                      textAlign: "center",
                      fontStyle: "italic",
                      flexShrink: 0,
                    }}
                  >
                    {index + 4}
                  </Typography>
                  <Box
                    sx={{
                      position: "relative",
                      width: 42,
                      height: 58,
                      borderRadius: 0.75,
                      overflow: "hidden",
                      bgcolor: "#0b0b0b",
                      flexShrink: 0,
                    }}
                  >
                    {manga.coverImage ? (
                      <Image
                        src={manga.coverImage}
                        alt={manga.title}
                        fill
                        sizes="84px"
                        style={{ objectFit: "cover" }}
                      />
                    ) : null}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: "#fafafa",
                      minWidth: 0,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      lineHeight: 1.35,
                    }}
                  >
                    {manga.title}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: dashboardTokens.accent, lineHeight: 1 }}>
                    {manga.viewCount?.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: dashboardTokens.textSoft, fontSize: "0.7rem", display: "block", mt: 0.25 }}>
                    ผู้ชม {manga.uniqueVisitors.toLocaleString()}
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

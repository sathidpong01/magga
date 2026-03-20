import { db } from "@/db";
import { 
  manga as mangaTable,
  categories as categoriesTable,
  tags as tagsTable,
  profiles as usersTable,
  comments as commentsTable,
  mangaSubmissions as submissionsTable
} from "@/db/schema";
import { count, eq, sum, desc } from "drizzle-orm";
import { Box, Typography, Grid, Chip, Divider } from "@mui/material";
import CategoryIcon from "@mui/icons-material/Category";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PeopleIcon from "@mui/icons-material/People";
import CommentIcon from "@mui/icons-material/Comment";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditNoteIcon from "@mui/icons-material/EditNote";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import AssignmentIcon from "@mui/icons-material/Assignment";
import Link from "next/link";
import Image from "next/image";

// Dynamic rendering for real-time data
export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  icon,
  color,
  href,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  href?: string;
}) {
  const content = (
    <Box
      sx={{
        p: 2.5,
        bgcolor: "#141414",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 1.25, // 10px
        display: "flex",
        alignItems: "center",
        gap: 2.5,
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "hidden",
        ...(href && {
          "&:hover": { 
            borderColor: color === "#FABF06" ? "rgba(250, 191, 6, 0.4)" : color, 
            cursor: "pointer",
            bgcolor: "#1a1a1a",
            transform: "translateY(-2px)",
          },
        }),
      }}
    >
      <Box
        sx={{
          p: 1.25,
          borderRadius: 1,
          bgcolor: `${color}10`,
          color: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid ${color}20`,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#fafafa", lineHeight: 1.1, fontSize: "1.35rem" }}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </Typography>
        <Typography variant="caption" sx={{ color: "#a3a3a3", fontWeight: 500, letterSpacing: "0.02em", mt: 0.5, display: "block" }}>
          {label.toUpperCase()}
        </Typography>
      </Box>
    </Box>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        {content}
      </Link>
    );
  }
  return content;
}

export default async function AdminPage() {
  // Stats
  const [{ count: totalManga }] = await db.select({ count: count() }).from(mangaTable);
  const [{ count: totalCategories }] = await db.select({ count: count() }).from(categoriesTable);
  const [{ count: totalTags }] = await db.select({ count: count() }).from(tagsTable);
  const [{ count: draftManga }] = await db.select({ count: count() }).from(mangaTable).where(eq(mangaTable.isHidden, true));
  const [{ count: totalUsers }] = await db.select({ count: count() }).from(usersTable);
  const [{ count: totalComments }] = await db.select({ count: count() }).from(commentsTable);
  const [{ count: pendingSubmissions }] = await db.select({ count: count() }).from(submissionsTable).where(eq(submissionsTable.status, "PENDING"));

  // Total views across all manga
  const [{ totalViewsAgg }] = await db.select({ totalViewsAgg: sum(mangaTable.viewCount) }).from(mangaTable);
  const totalViews = Number(totalViewsAgg || 0);

  // Top 10 Popular Manga
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

  return (
    <Box>
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: "-0.02em", color: "#fafafa" }}>
            OVERVIEW
          </Typography>
          <Typography variant="body2" sx={{ color: "#a3a3a3" }}>
            ยินดีต้อนรับกลับ, คุณกำลังดูแลระบบ Magga ในขณะนี้
          </Typography>
        </Box>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Total Manga"
            value={totalManga}
            icon={<AutoStoriesIcon />}
            color="#FABF06"
            href="/dashboard/admin/manga"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Total Users"
            value={totalUsers}
            icon={<PeopleIcon />}
            color="#10b981"
            href="/dashboard/admin/users"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Total Comments"
            value={totalComments}
            icon={<CommentIcon />}
            color="#818cf8"
            href="/dashboard/admin/comments"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Submissions"
            value={pendingSubmissions}
            icon={<AssignmentIcon />}
            color="#EF4444"
            href="/dashboard/admin/submissions"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label="ฉบับร่าง"
            value={draftManga}
            icon={<EditNoteIcon />}
            color="#94a3b8"
            href="/dashboard/admin/manga"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label="เข้าชมรวม"
            value={totalViews}
            icon={<VisibilityIcon />}
            color="#4ade80"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label="หมวดหมู่"
            value={totalCategories}
            icon={<CategoryIcon />}
            color="#fb923c"
            href="/dashboard/admin/metadata"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label="แท็ก"
            value={totalTags}
            icon={<LocalOfferIcon />}
            color="#2dd4bf"
            href="/dashboard/admin/metadata"
          />
        </Grid>
      </Grid>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 3 }} />

      {/* Top 10 Popular Manga */}
      <Box
        sx={{
          bgcolor: "#141414",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 1.25,
          p: 2.5,
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: "flex", alignItems: "center", gap: 1, color: "#fafafa" }}>
            <TrendingUpIcon sx={{ color: "#FABF06" }} /> TOP 10 MOST READ
          </Typography>
        </Box>

        {/* Top 3 Grid */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {topManga.slice(0, 3).map((manga, index) => (
            <Grid key={manga.id} size={{ xs: 12, sm: 4 }}>
              <Link href={`/${manga.slug}`} style={{ textDecoration: "none" }}>
                <Box
                  sx={{
                    position: "relative",
                    height: 180,
                    borderRadius: 1.25,
                    overflow: "hidden",
                    bgcolor: "#0B0B0B",
                    border: "1px solid rgba(255,255,255,0.06)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      borderColor: "rgba(250, 191, 6, 0.4)",
                      "& .top3-overlay": { opacity: 1 },
                      "& img": { transform: "scale(1.05)" }
                    }
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      zIndex: 10,
                      bgcolor: "#FABF06",
                      color: "#000",
                      width: 28,
                      height: 28,
                      borderRadius: 0.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: "0.9rem",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
                    }}
                  >
                    {index + 1}
                  </Box>
                  {manga.coverImage && (
                    <Image
                      src={manga.coverImage}
                      alt={manga.title}
                      fill
                      sizes="(max-width: 600px) 100vw, 33vw"
                      style={{ objectFit: "cover", transition: "transform 0.5s ease" }}
                    />
                  )}
                  <Box
                    className="top3-overlay"
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      p: 2,
                      background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      minHeight: "60%",
                      transition: "opacity 0.3s ease"
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 800,
                        color: "#fafafa",
                        lineHeight: 1.2,
                        mb: 0.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}
                    >
                      {manga.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#FABF06", fontWeight: 700 }}>
                      {manga.viewCount?.toLocaleString() || 0} VIEWS
                    </Typography>
                  </Box>
                </Box>
              </Link>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
          {topManga.slice(3).map((manga, index) => (
            <Link
              key={manga.id}
              href={`/${manga.slug}`}
              style={{ textDecoration: "none" }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1.5,
                  bgcolor: "#0B0B0B",
                  borderRadius: 1,
                  border: "1px solid rgba(255,255,255,0.04)",
                  textDecoration: "none",
                  transition: "all 0.2s",
                  "&:hover": {
                    bgcolor: "#1c1c1c",
                    borderColor: "rgba(255,255,255,0.12)",
                    transform: "translateX(4px)",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      width: 40,
                      fontWeight: 900,
                      color: index < 3 ? "#FABF06" : "#404040",
                      textAlign: "center",
                      fontStyle: "italic"
                    }}
                  >
                    {index + 4}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: "#fafafa",
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
                  <Typography variant="body2" sx={{ fontWeight: 800, color: "#FABF06", lineHeight: 1 }}>
                    {manga.viewCount?.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#737373", fontSize: "0.65rem", display: "block", mt: 0.25 }}>
                    VIEWS
                  </Typography>
                </Box>
              </Box>
            </Link>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

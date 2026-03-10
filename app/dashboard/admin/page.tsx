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
import BookIcon from "@mui/icons-material/Book";
import CategoryIcon from "@mui/icons-material/Category";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PeopleIcon from "@mui/icons-material/People";
import CommentIcon from "@mui/icons-material/Comment";
import VisibilityIcon from "@mui/icons-material/Visibility";
import InboxIcon from "@mui/icons-material/Inbox";
import EditNoteIcon from "@mui/icons-material/EditNote";
import Link from "next/link";

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
        p: 2,
        bgcolor: "#171717",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 0.75,
        display: "flex",
        alignItems: "center",
        gap: 2,
        transition: "border-color 0.2s",
        ...(href && {
          "&:hover": { borderColor: color, cursor: "pointer" },
        }),
      }}
    >
      <Box
        sx={{
          p: 1,
          borderRadius: 0.75,
          bgcolor: `${color}15`,
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#fafafa", lineHeight: 1.2 }}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </Typography>
        <Typography variant="caption" sx={{ color: "#a3a3a3" }}>
          {label}
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
    },
  });

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, color: "#fafafa", mb: 0.5 }}>
        ภาพรวม
      </Typography>
      <Typography variant="body2" sx={{ color: "#a3a3a3", mb: 3 }}>
        สถิติและข้อมูลสรุปของระบบ
      </Typography>

      {/* Stats Grid */}
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label="มังงะทั้งหมด"
            value={totalManga}
            icon={<BookIcon fontSize="small" />}
            color="#60a5fa"
            href="/dashboard/admin/manga"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label="ฉบับร่าง"
            value={draftManga}
            icon={<EditNoteIcon fontSize="small" />}
            color="#fbbf24"
            href="/dashboard/admin/manga"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label="เข้าชมรวม"
            value={totalViews}
            icon={<VisibilityIcon fontSize="small" />}
            color="#4ade80"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label="รออนุมัติ"
            value={pendingSubmissions}
            icon={<InboxIcon fontSize="small" />}
            color="#fb923c"
            href="/dashboard/admin/submissions"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label="ผู้ใช้"
            value={totalUsers}
            icon={<PeopleIcon fontSize="small" />}
            color="#22d3ee"
            href="/dashboard/admin/users"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label="ความคิดเห็น"
            value={totalComments}
            icon={<CommentIcon fontSize="small" />}
            color="#a855f7"
            href="/dashboard/admin/comments"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label="หมวดหมู่"
            value={totalCategories}
            icon={<CategoryIcon fontSize="small" />}
            color="#a78bfa"
            href="/dashboard/admin/metadata"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label="แท็ก"
            value={totalTags}
            icon={<LocalOfferIcon fontSize="small" />}
            color="#f472b6"
            href="/dashboard/admin/metadata"
          />
        </Grid>
      </Grid>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 3 }} />

      {/* Top 10 Popular Manga */}
      <Box
        sx={{
          bgcolor: "#171717",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 0.75,
          p: 2.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 0.75,
              bgcolor: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              display: "flex",
            }}
          >
            <TrendingUpIcon fontSize="small" />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fafafa" }}>
            Top 10 ยอดนิยม
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {topManga.map((manga, index) => (
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
                  py: 1,
                  px: 1.5,
                  borderRadius: 0.5,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                  <Chip
                    label={`#${index + 1}`}
                    size="small"
                    sx={{
                      bgcolor: index < 3 ? "rgba(251, 191, 36, 0.15)" : "rgba(255,255,255,0.06)",
                      color: index < 3 ? "#fbbf24" : "#737373",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      height: 22,
                      borderRadius: 0.5,
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#e5e5e5",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {manga.title}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: "#737373", flexShrink: 0, ml: 2 }}>
                  {manga.viewCount.toLocaleString()} views
                </Typography>
              </Box>
            </Link>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

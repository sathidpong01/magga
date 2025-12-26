import prisma from "@/lib/prisma";
import { Box, Typography, Card, CardContent, Grid, Chip } from "@mui/material";
import BookIcon from "@mui/icons-material/Book";
import CategoryIcon from "@mui/icons-material/Category";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PeopleIcon from "@mui/icons-material/People";
import { resolveLocalImage } from "@/lib/image";
import AdminMangaTable from "./components/AdminMangaTable";
import Link from "next/link";

// Dynamic rendering for real-time data
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const mangas = await prisma.manga.findMany({
    include: {
      category: true,
      tags: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // resolve cover URLs to safe paths (check for local files)
  const resolved = await Promise.all(
    mangas.map(async (m) => ({
      id: m.id,
      title: m.title,
      slug: m.slug,
      isHidden: m.isHidden,
      viewCount: m.viewCount,
      _cover: await resolveLocalImage(m.coverImage),
      category: m.category,
      tags: m.tags,
    }))
  );

  // Fetch all categories and tags for quick edit
  const allCategories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  const allTags = await prisma.tag.findMany({ orderBy: { name: "asc" } });

  // Stats
  const totalManga = await prisma.manga.count();
  const totalCategories = await prisma.category.count();
  const totalTags = await prisma.tag.count();
  const draftManga = await prisma.manga.count({ where: { isHidden: true } });
  const totalUsers = await prisma.user.count();
  const totalComments = await prisma.comment.count();
  const pendingSubmissions = await prisma.mangaSubmission.count({
    where: { status: "PENDING" },
  });

  // Total views across all manga
  const viewsAgg = await prisma.manga.aggregate({
    _sum: { viewCount: true },
  });
  const totalViews = viewsAgg._sum.viewCount || 0;

  // Top 10 Popular Manga
  const topManga = await prisma.manga.findMany({
    where: { isHidden: false },
    orderBy: { viewCount: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      slug: true,
      viewCount: true,
    },
  });

  return (
    <Box>
      {/* Quick Access - Merged Cards */}
      <Typography
        variant="h6"
        sx={{ mb: 2, fontWeight: 600, color: "#fafafa" }}
      >
        ทางลัด
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Manga Stats Card */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: 1,
              boxShadow: "none",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "linear-gradient(135deg, #171717 0%, #1a1a2e 100%)",
              p: 1,
            }}
          >
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}
              >
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    bgcolor: "rgba(251, 191, 36, 0.15)",
                    color: "#fbbf24",
                  }}
                >
                  <BookIcon fontSize="small" />
                </Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: "#fafafa" }}
                >
                  Manga
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: "rgba(96, 165, 250, 0.1)",
                      border: "1px solid rgba(96, 165, 250, 0.2)",
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: "#60a5fa" }}
                    >
                      {totalManga}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#a3a3a3", mt: 0.5 }}
                    >
                      เผยแพร่แล้ว
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: "rgba(251, 191, 36, 0.1)",
                      border: "1px solid rgba(251, 191, 36, 0.2)",
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: "#fbbf24" }}
                    >
                      {draftManga}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#a3a3a3", mt: 0.5 }}
                    >
                      ฉบับร่าง
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: "rgba(74, 222, 128, 0.1)",
                      border: "1px solid rgba(74, 222, 128, 0.2)",
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: "#4ade80" }}
                    >
                      {totalViews.toLocaleString()}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#a3a3a3", mt: 0.5 }}
                    >
                      ผู้เข้าชมรวม
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Classification Card */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: 1,
              boxShadow: "none",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "linear-gradient(135deg, #171717 0%, #1e1a2e 100%)",
              p: 1,
            }}
          >
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}
              >
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    bgcolor: "rgba(167, 139, 250, 0.15)",
                    color: "#a78bfa",
                  }}
                >
                  <CategoryIcon fontSize="small" />
                </Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: "#fafafa" }}
                >
                  หมวดหมู่
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: "rgba(167, 139, 250, 0.1)",
                      border: "1px solid rgba(167, 139, 250, 0.2)",
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: "#a78bfa" }}
                    >
                      {totalCategories}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#a3a3a3", mt: 0.5 }}
                    >
                      หมวดหมู่
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: "rgba(244, 114, 182, 0.1)",
                      border: "1px solid rgba(244, 114, 182, 0.2)",
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: "#f472b6" }}
                    >
                      {totalTags}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#a3a3a3", mt: 0.5 }}
                    >
                      แท็ก
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Users & Community Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: 1,
              boxShadow: "none",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "linear-gradient(135deg, #171717 0%, #1a1e2e 100%)",
              p: 1,
            }}
          >
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}
              >
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    bgcolor: "rgba(34, 211, 238, 0.15)",
                    color: "#22d3ee",
                  }}
                >
                  <PeopleIcon fontSize="small" />
                </Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: "#fafafa" }}
                >
                  ผู้ใช้ & ชุมชน
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: "rgba(34, 211, 238, 0.1)",
                      border: "1px solid rgba(34, 211, 238, 0.2)",
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: "#22d3ee" }}
                    >
                      {totalUsers}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#a3a3a3", mt: 0.5 }}
                    >
                      ผู้ใช้
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: "rgba(168, 85, 247, 0.1)",
                      border: "1px solid rgba(168, 85, 247, 0.2)",
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: "#a855f7" }}
                    >
                      {totalComments}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#a3a3a3", mt: 0.5 }}
                    >
                      ความคิดเห็น
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box
                    component={Link}
                    href="/admin/submissions"
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: "rgba(251, 146, 60, 0.1)",
                      border: "1px solid rgba(251, 146, 60, 0.2)",
                      textAlign: "center",
                      display: "block",
                      textDecoration: "none",
                      transition: "all 0.2s",
                      "&:hover": {
                        bgcolor: "rgba(251, 146, 60, 0.2)",
                      },
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: "#fb923c" }}
                    >
                      {pendingSubmissions}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#a3a3a3", mt: 0.5 }}
                    >
                      รออนุมัติ
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Top 10 Popular Manga */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: 1,
              boxShadow: "none",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "linear-gradient(135deg, #171717 0%, #2e1a1a 100%)",
              p: 1,
            }}
          >
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}
              >
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    bgcolor: "rgba(239, 68, 68, 0.15)",
                    color: "#ef4444",
                  }}
                >
                  <TrendingUpIcon fontSize="small" />
                </Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: "#fafafa" }}
                >
                  Top 10 ยอดนิยม
                </Typography>
              </Box>
              <Box sx={{ maxHeight: 180, overflow: "auto" }}>
                {topManga.map((manga, index) => (
                  <Box
                    key={manga.id}
                    component={Link}
                    href={`/${manga.slug}`}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      py: 0.75,
                      px: 1,
                      borderRadius: 0.5,
                      textDecoration: "none",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        label={`#${index + 1}`}
                        size="small"
                        sx={{
                          bgcolor: index < 3 ? "rgba(251, 191, 36, 0.2)" : "rgba(255,255,255,0.1)",
                          color: index < 3 ? "#fbbf24" : "#a3a3a3",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          height: 20,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#fafafa",
                          maxWidth: 180,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {manga.title}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: "#a3a3a3" }}>
                      {manga.viewCount.toLocaleString()} views
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Manga List Table with Real-time Search */}
      <AdminMangaTable
        mangas={resolved}
        allCategories={allCategories}
        allTags={allTags}
      />
    </Box>
  );
}

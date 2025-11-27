import prisma from "@/lib/prisma";
import Link from "next/link";
import MangaActions from "./MangaActions";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Card,
  CardContent,
  Grid,
  IconButton,
  InputBase,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import BookIcon from "@mui/icons-material/Book";
import CategoryIcon from "@mui/icons-material/Category";
import TagIcon from "@mui/icons-material/LocalOffer";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import StarIcon from "@mui/icons-material/Star";
import { resolveLocalImage } from "@/lib/image";

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
    mangas.map(async (m) => ({ ...m, _cover: await resolveLocalImage(m.coverImage) }))
  );

  const totalManga = await prisma.manga.count();
  const totalCategories = await prisma.category.count();
  const totalTags = await prisma.tag.count();
  const draftManga = await prisma.manga.count({ where: { isHidden: true } });

  // View Count & Rating Statistics
  const totalViewsResult = await prisma.manga.aggregate({
    _sum: {
      viewCount: true,
    },
  });
  const totalViews = totalViewsResult._sum.viewCount || 0;

  const avgRatingResult = await prisma.manga.aggregate({
    _avg: {
      averageRating: true,
    },
    where: {
      ratingCount: {
        gt: 0,
      },
    },
  });
  const averageRating = avgRatingResult._avg.averageRating || 0;

  // Top 10 Manga by Views
  const topMangaByViews = await prisma.manga.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      viewCount: true,
      averageRating: true,
      ratingCount: true,
    },
    orderBy: {
      viewCount: "desc",
    },
    take: 10,
  });

  // Top 10 Manga by Rating  
  const topMangaByRating = await prisma.manga.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      viewCount: true,
      averageRating: true,
      ratingCount: true,
    },
    where: {
      ratingCount: {
        gte: 1, // Changed from 5 to 1
      },
    },
    orderBy: {
      averageRating: "desc",
    },
    take: 10,
  });

  // Placeholder for query
  const query = "";

  return (
    <Box>
      {/* Header & Search */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Paper
          component="form"
          sx={{
            p: "2px 4px",
            display: "flex",
            alignItems: "center",
            width: 400,
            borderRadius: 1,
            boxShadow: "none",
            bgcolor: "#171717",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <IconButton sx={{ p: "10px" }} aria-label="search">
            <SearchIcon sx={{ color: "#a3a3a3" }} />
          </IconButton>
          <InputBase
            sx={{ ml: 1, flex: 1, color: "#fafafa" }}
            placeholder="Search manga..."
            inputProps={{ "aria-label": "search manga" }}
            name="search"
            defaultValue={query}
          />
        </Paper>
      </Box>

      {/* Quick Stats */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "#fafafa" }}>
        Quick Stats
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { title: "Total Manga", value: totalManga, color: "#60a5fa", icon: <BookIcon /> },
          { title: "Total Views", value: totalViews.toLocaleString(), color: "#38bdf8", icon: <VisibilityIcon /> },
          { title: "Avg Rating", value: averageRating > 0 ? averageRating.toFixed(2) : "N/A", color: "#fbbf24", icon: <StarIcon /> },
          { title: "Categories", value: totalCategories, color: "#a78bfa", icon: <CategoryIcon /> },
        ].map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Card sx={{ borderRadius: 1, boxShadow: "none", border: "1px solid rgba(255, 255, 255, 0.1)", bgcolor: "#171717" }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: `${stat.color}15`, color: stat.color }}>
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: "#a3a3a3" }}>
                    {stat.title}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: "#fafafa" }}>
                    {stat.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Top Manga Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Top by Views */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ borderRadius: 1, boxShadow: "none", border: "1px solid rgba(255, 255, 255, 0.1)", bgcolor: "#171717", overflow: "hidden" }}>
            <Box sx={{ p: 3, borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <VisibilityIcon sx={{ color: "#38bdf8" }} />
                <Typography variant="h6" fontWeight="bold" sx={{ color: "#fafafa" }}>
                  Top 10 by Views
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: "#a3a3a3" }}>
                Most viewed manga
              </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              {topMangaByViews.map((manga, index) => (
                <Box
                  key={manga.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    mb: 1,
                    borderRadius: 1,
                    bgcolor: index < 3 ? 'rgba(56, 189, 248, 0.05)' : 'transparent',
                    border: index < 3 ? '1px solid rgba(56, 189, 248, 0.1)' : '1px solid transparent',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    <Typography
                      sx={{
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        bgcolor: index < 3 ? '#38bdf8' : '#404040',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {index + 1}
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ color: "#fafafa", fontWeight: 500 }} noWrap>
                        {manga.title}
                      </Typography>
                      {manga.averageRating > 0 && (
                        <Typography variant="caption" sx={{ color: "#a3a3a3" }}>
                          ⭐ {manga.averageRating.toFixed(1)} ({manga.ratingCount} ratings)
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ color: "#38bdf8" }}>
                    {manga.viewCount.toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Top by Rating */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ borderRadius: 1, boxShadow: "none", border: "1px solid rgba(255, 255, 255, 0.1)", bgcolor: "#171717", overflow: "hidden" }}>
            <Box sx={{ p: 3, borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <StarIcon sx={{ color: "#fbbf24" }} />
                <Typography variant="h6" fontWeight="bold" sx={{ color: "#fafafa" }}>
                  Top 10 by Rating
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: "#a3a3a3" }}>
                Highest rated manga (min 1 rating)
              </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              {topMangaByRating.map((manga, index) => (
                <Box
                  key={manga.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    mb: 1,
                    borderRadius: 1,
                    bgcolor: index < 3 ? 'rgba(251, 191, 36, 0.05)' : 'transparent',
                    border: index < 3 ? '1px solid rgba(251, 191, 36, 0.1)' : '1px solid transparent',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    <Typography
                      sx={{
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        bgcolor: index < 3 ? '#fbbf24' : '#404040',
                        color: '#000',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {index + 1}
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ color: "#fafafa", fontWeight: 500 }} noWrap>
                        {manga.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#a3a3a3" }}>
                        👁️ {manga.viewCount.toLocaleString()} views
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: "#fbbf24" }}>
                      ⭐ {manga.averageRating.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#a3a3a3" }}>
                      {manga.ratingCount} ratings
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Manga List Table */}
      <Paper sx={{ borderRadius: 1, boxShadow: "none", border: "1px solid rgba(255, 255, 255, 0.1)", bgcolor: "#171717", overflow: "hidden" }}>
        <Box sx={{ p: 3, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ color: "#fafafa" }}>
              Manga List
            </Typography>
            <Typography variant="body2" sx={{ color: "#a3a3a3" }}>
              Manage your manga library
            </Typography>
          </Box>
          <Button
            component={Link}
            href="/admin/manga/new"
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ borderRadius: 1, textTransform: 'none', bgcolor: '#8b5cf6' }}
          >
            Add New
          </Button>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow sx={{ bgcolor: "#0a0a0a" }}>
                <TableCell sx={{ fontWeight: 600, color: "#a3a3a3", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>Cover</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#a3a3a3", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#a3a3a3", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#a3a3a3", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: "#a3a3a3", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resolved.map((manga) => (
                <TableRow
                  key={manga.id}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell sx={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                    <Box
                      component="img"
                      src={manga._cover}
                      alt={manga.title}
                      sx={{ width: 40, height: 56, objectFit: "cover", borderRadius: 0.5, bgcolor: "#262626" }}
                    />
                  </TableCell>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 500, color: "#fafafa", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                    {manga.title}
                  </TableCell>
                  <TableCell sx={{ color: "#d4d4d4", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                    {manga.category?.name || "Uncategorized"}
                  </TableCell>
                  <TableCell sx={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                    {manga.isHidden ? (
                      <Chip 
                        label="Hidden" 
                        size="small" 
                        sx={{ 
                          bgcolor: 'rgba(234, 179, 8, 0.2)',
                          color: '#facc15',
                          fontWeight: 600,
                          borderRadius: 0.5,
                          height: 24
                        }} 
                      />
                    ) : (
                      <Chip 
                        label="Published" 
                        size="small" 
                        sx={{ 
                          bgcolor: 'rgba(34, 197, 94, 0.2)',
                          color: '#4ade80',
                          fontWeight: 600,
                          borderRadius: 0.5,
                          height: 24
                        }} 
                      />
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                    <MangaActions mangaId={manga.id} isHidden={manga.isHidden} slug={manga.slug} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
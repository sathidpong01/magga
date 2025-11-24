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

  // Placeholder for query, assuming it might come from search params in a real app
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
            bgcolor: "#1e293b",
            border: "1px solid #334155",
          }}
        >
          <IconButton sx={{ p: "10px" }} aria-label="search">
            <SearchIcon sx={{ color: "#94a3b8" }} />
          </IconButton>
          <InputBase
            sx={{ ml: 1, flex: 1, color: "#f8fafc" }}
            placeholder="Search manga..."
            inputProps={{ "aria-label": "search manga" }}
            name="search"
            defaultValue={query}
          />
        </Paper>
      </Box>

      {/* Quick Stats */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "#f8fafc" }}>
        Quick Access
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { title: "Total Manga", value: totalManga, color: "#60a5fa", icon: <BookIcon /> },
          { title: "Categories", value: totalCategories, color: "#a78bfa", icon: <CategoryIcon /> },
          { title: "Total Tags", value: totalTags, color: "#f472b6", icon: <TagIcon /> },
          { title: "Drafts", value: draftManga, color: "#fbbf24", icon: <EditIcon /> },
        ].map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Card sx={{ borderRadius: 1, boxShadow: "none", border: "1px solid #334155", bgcolor: "#1e293b" }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: `${stat.color}15`, color: stat.color }}>
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                    {stat.title}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: "#f8fafc" }}>
                    {stat.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Manga List Table */}
      <Paper sx={{ borderRadius: 1, boxShadow: "none", border: "1px solid #334155", bgcolor: "#1e293b", overflow: "hidden" }}>
        <Box sx={{ p: 3, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #334155" }}>
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ color: "#f8fafc" }}>
              Manga List
            </Typography>
            <Typography variant="body2" sx={{ color: "#94a3b8" }}>
              Manage your manga library
            </Typography>
          </Box>
          <Button
            component={Link}
            href="/admin/manga/new"
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ borderRadius: 1, textTransform: 'none', bgcolor: '#6366f1' }}
          >
            Add New
          </Button>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow sx={{ bgcolor: "#0f172a" }}>
                <TableCell sx={{ fontWeight: 600, color: "#94a3b8", borderBottom: "1px solid #334155" }}>Cover</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#94a3b8", borderBottom: "1px solid #334155" }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#94a3b8", borderBottom: "1px solid #334155" }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#94a3b8", borderBottom: "1px solid #334155" }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: "#94a3b8", borderBottom: "1px solid #334155" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resolved.map((manga) => (
                <TableRow
                  key={manga.id}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell sx={{ borderBottom: "1px solid #334155" }}>
                    <Box
                      component="img"
                      src={manga._cover}
                      alt={manga.title}
                      sx={{ width: 40, height: 56, objectFit: "cover", borderRadius: 0.5, bgcolor: "#334155" }}
                    />
                  </TableCell>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 500, color: "#f8fafc", borderBottom: "1px solid #334155" }}>
                    {manga.title}
                  </TableCell>
                  <TableCell sx={{ color: "#cbd5e1", borderBottom: "1px solid #334155" }}>
                    {manga.category?.name || "Uncategorized"}
                  </TableCell>
                  <TableCell sx={{ borderBottom: "1px solid #334155" }}>
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
                  <TableCell align="right" sx={{ borderBottom: "1px solid #334155" }}>
                    <MangaActions mangaId={manga.id} isHidden={manga.isHidden} />
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
import prisma from "@/lib/prisma";
import LinkButton from "@/app/components/LinkButton";
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

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

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
            bgcolor: "#171717", // Neutral 900
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
          <LinkButton
            href="/admin/manga/new"
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ borderRadius: 1, textTransform: 'none', bgcolor: '#8b5cf6' }}
          >
            Add New
          </LinkButton>
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
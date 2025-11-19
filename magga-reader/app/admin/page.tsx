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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Image from "next/image";
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
  const normalizeSrc = (s?: string) => {
    if (!s) return s || '';
    try {
      const u = new URL(s);
      // If the image is served from localhost, strip origin so it's a relative path
      if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
        return u.pathname + u.search;
      }
      // If path includes uploads, return relative uploads path
      if (u.pathname && u.pathname.includes('/uploads/')) {
        return u.pathname + u.search;
      }
    } catch (e) {
      // not an absolute URL
    }
    // Fallback: if string contains /uploads/ return substring
    const idx = s.indexOf('/uploads/');
    if (idx !== -1) return s.substring(idx);
    return s;
  };

  // resolve cover URLs to safe paths (check for local files)
  const resolved = await Promise.all(
    mangas.map(async (m) => ({ ...m, _cover: await resolveLocalImage(m.coverImage) }))
  );

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4" component="h1">
          Manga
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          href="/admin/manga/new"
        >
          Add New Manga
        </Button>
      </Box>

      <TableContainer>
        <Table sx={{ minWidth: 650 }} aria-label="manga table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Cover</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Tags</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {resolved.map((manga) => (
              <TableRow
                key={manga.id}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell>
                  <Image
                    src={manga._cover}
                    alt={manga.title}
                    width={50}
                    height={70}
                    style={{ objectFit: 'cover', borderRadius: '4px' }}
                  />
                </TableCell>
                <TableCell component="th" scope="row">
                  {manga.title}
                </TableCell>
                <TableCell>{manga.category?.name || "N/A"}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {manga.tags.map((tag) => (
                      <Chip key={tag.id} label={tag.name} size="small" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <MangaActions mangaId={manga.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
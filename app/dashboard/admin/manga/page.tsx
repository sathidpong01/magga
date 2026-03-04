import { db } from "@/db";
import { manga as mangaTable, categories as categoriesTable, tags as tagsTable, authors as authorsTable } from "@/db/schema";
import { desc, asc } from "drizzle-orm";
import { Box, Typography } from "@mui/material";
import Link from "next/link";
import MangaDataTable from "./MangaDataTable";

export const dynamic = "force-dynamic";

export default async function AdminMangaPage() {
  const mangasQuery = await db.query.manga.findMany({
    with: {
      category: true,
      mangaTags_mangaId: {
        with: {
          tag_tagId: true
        }
      },
      author: true,
    },
    orderBy: [desc(mangaTable.createdAt)],
  });

  const mangas = mangasQuery.map(m => ({
    ...m,
    tags: m.mangaTags_mangaId.map((mt: any) => mt.tag_tagId)
  }));

  const allCategories = await db.query.categories.findMany({
    orderBy: [asc(categoriesTable.name)],
  });

  const allTags = await db.query.tags.findMany({
    orderBy: [asc(tagsTable.name)],
  });

  const allAuthors = await db.query.authors.findMany({
    orderBy: [asc(authorsTable.name)],
  });

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          จัดการมังงะ
        </Typography>
        <Link
          href="/dashboard/admin/manga/create"
          style={{
            textDecoration: "none",
            backgroundColor: "#fbbf24",
            color: "#000",
            padding: "8px 20px",
            borderRadius: "50px",
            fontWeight: 600,
            display: "inline-block",
          }}
        >
          + เพิ่มมังงะใหม่
        </Link>
      </Box>

      <MangaDataTable
        initialMangas={mangas}
        allCategories={allCategories}
        allTags={allTags}
        allAuthors={allAuthors}
      />
    </Box>
  );
}

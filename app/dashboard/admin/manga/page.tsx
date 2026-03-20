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
        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: "-0.02em", color: "#fafafa" }}>
          MANAGE MANGA
        </Typography>
        <Link
          href="/dashboard/admin/manga/create"
          style={{
            textDecoration: "none",
            backgroundColor: "#FABF06",
            color: "#000",
            padding: "10px 24px",
            borderRadius: "10px",
            fontWeight: 800,
            fontSize: "0.875rem",
            display: "inline-flex",
            alignItems: "center",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            boxShadow: "0 4px 14px rgba(250, 191, 6, 0.2)",
          }}
        >
          + NEW MANGA
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

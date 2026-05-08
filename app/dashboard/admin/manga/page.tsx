import { db } from "@/db";
import {
  authors as authorsTable,
  categories as categoriesTable,
  manga as mangaTable,
  mangaTags as mangaTagsTable,
  tags as tagsTable,
} from "@/db/schema";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { Box, Chip, Stack, Typography } from "@mui/material";
import Link from "next/link";
import MangaDataTable from "./MangaDataTable";

export const dynamic = "force-dynamic";

const ADMIN_MANGA_LIMIT = 200;
const ADMIN_METADATA_LIMIT = 500;

export default async function AdminMangaPage() {
  const [mangasQuery, allCategories, allTags, allAuthors] = await Promise.all([
    db
      .select({
        id: mangaTable.id,
        title: mangaTable.title,
        slug: mangaTable.slug,
        coverImage: mangaTable.coverImage,
        isHidden: mangaTable.isHidden,
        viewCount: mangaTable.viewCount,
        categoryId: mangaTable.categoryId,
        authorId: mangaTable.authorId,
      })
      .from(mangaTable)
      .orderBy(desc(mangaTable.createdAt))
      .limit(ADMIN_MANGA_LIMIT),
    db.query.categories.findMany({
      orderBy: [asc(categoriesTable.name)],
      limit: ADMIN_METADATA_LIMIT,
    }),
    db.query.tags.findMany({
      orderBy: [asc(tagsTable.name)],
      limit: ADMIN_METADATA_LIMIT,
    }),
    db.query.authors.findMany({
      orderBy: [asc(authorsTable.name)],
      limit: ADMIN_METADATA_LIMIT,
    }),
  ]);

  const mangaIds = mangasQuery.map((manga) => manga.id);
  const mangaTagRows = mangaIds.length
    ? await db
        .select({
          mangaId: mangaTagsTable.mangaId,
          tagId: tagsTable.id,
          tagName: tagsTable.name,
        })
        .from(mangaTagsTable)
        .innerJoin(tagsTable, eq(tagsTable.id, mangaTagsTable.tagId))
        .where(inArray(mangaTagsTable.mangaId, mangaIds))
    : [];

  const categoriesById = new Map(allCategories.map((category) => [category.id, category]));
  const authorsById = new Map(allAuthors.map((author) => [author.id, author]));
  const tagsByMangaId = new Map<string, Array<{ id: string; name: string }>>();

  for (const row of mangaTagRows) {
    const tags = tagsByMangaId.get(row.mangaId) ?? [];
    tags.push({ id: row.tagId, name: row.tagName });
    tagsByMangaId.set(row.mangaId, tags);
  }

  const mangas = mangasQuery.map((manga) => ({
    ...manga,
    category: manga.categoryId ? categoriesById.get(manga.categoryId) ?? null : null,
    author: manga.authorId ? authorsById.get(manga.authorId) ?? null : null,
    tags: tagsByMangaId.get(manga.id) ?? [],
  }));

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
      }}
    >
      <Box
        sx={{
          borderRadius: 1.5,
          border: "1px solid rgba(255,255,255,0.06)",
          backgroundImage:
            "linear-gradient(180deg, rgba(251,191,36,0.06) 0%, rgba(20,20,20,0.92) 100%)",
          p: { xs: 2.25, md: 3 },
          boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Box sx={{ maxWidth: 720 }}>
            <Typography
              variant="overline"
              sx={{
                color: "#fbbf24",
                fontWeight: 800,
                letterSpacing: "0.14em",
                display: "block",
                mb: 0.5,
              }}
            >
              DASHBOARD / MANGA
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                letterSpacing: "-0.03em",
                color: "#fafafa",
                mb: 0.75,
                fontSize: { xs: "1.8rem", md: "2.25rem" },
              }}
            >
              จัดการมังงะ
            </Typography>
            <Typography sx={{ color: "#a3a3a3", lineHeight: 1.7 }}>
              ดูรายการมังงะทั้งหมด แก้ quick settings จัดหมวดหมู่ แท็ก และผู้แต่ง
              ด้วย workspace เดียวกัน
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip
              label={`ล่าสุด ${mangas.length}`}
              sx={{
                bgcolor: "#171717",
                color: "#fafafa",
                border: "1px solid rgba(255,255,255,0.08)",
                fontWeight: 700,
              }}
            />
            <Chip
              label={`หมวดหมู่ ${allCategories.length}`}
              sx={{
                bgcolor: "rgba(251,191,36,0.08)",
                color: "#fbbf24",
                border: "1px solid rgba(251,191,36,0.18)",
                fontWeight: 700,
              }}
            />
            <Chip
              label={`แท็ก ${allTags.length}`}
              sx={{
                bgcolor: "rgba(96,165,250,0.08)",
                color: "#93c5fd",
                border: "1px solid rgba(96,165,250,0.18)",
                fontWeight: 700,
              }}
            />
            <Chip
              label={`ผู้แต่ง ${allAuthors.length}`}
              sx={{
                bgcolor: "rgba(139,92,246,0.08)",
                color: "#c4b5fd",
                border: "1px solid rgba(139,92,246,0.18)",
                fontWeight: 700,
              }}
            />
            <Link
              href="/dashboard/admin/manga/create"
              style={{
                textDecoration: "none",
                backgroundColor: "#fbbf24",
                color: "#000",
                padding: "10px 18px",
                borderRadius: "8px",
                fontWeight: 800,
                fontSize: "0.875rem",
                display: "inline-flex",
                alignItems: "center",
                boxShadow: "0 4px 14px rgba(251, 191, 36, 0.2)",
              }}
            >
              + เพิ่มมังงะใหม่
            </Link>
          </Stack>
        </Stack>
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

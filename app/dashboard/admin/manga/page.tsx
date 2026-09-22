import { db } from "@/db";
import {
  authors as authorsTable,
  categories as categoriesTable,
  manga as mangaTable,
  mangaTags as mangaTagsTable,
  tags as tagsTable,
} from "@/db/schema";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import Link from "next/link";
import MangaDataTable from "./MangaDataTable";
import {
  DashboardSurface,
  dashboardTokens,
  dashboardPrimaryButtonSx,
} from "@/app/components/dashboard/system";

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
      <DashboardSurface
        sx={{
          p: { xs: 2.25, md: 3 },
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" }
          }}>
          <Box sx={{ maxWidth: 720 }}>
            <Typography
              variant="overline"
              sx={{
                color: dashboardTokens.accent,
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
                color: dashboardTokens.text,
                mb: 0.75,
                fontSize: { xs: "1.8rem", md: "2.25rem" },
              }}
            >
              จัดการมังงะ
            </Typography>
            <Typography sx={{ color: dashboardTokens.textMuted, lineHeight: 1.7 }}>
              ดูรายการมังงะทั้งหมด แก้ quick settings จัดหมวดหมู่ แท็ก และผู้แต่ง
              ด้วย workspace เดียวกัน
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} useFlexGap sx={{
            flexWrap: "wrap",
            alignItems: "center",
          }}>
            <Chip
              label={`ล่าสุด ${mangas.length}`}
              sx={{
                bgcolor: dashboardTokens.surfaceMuted,
                color: dashboardTokens.text,
                border: `1px solid ${dashboardTokens.border}`,
                fontWeight: 700,
              }}
            />
            <Chip
              label={`หมวดหมู่ ${allCategories.length}`}
              sx={{
                bgcolor: dashboardTokens.accentSoft,
                color: dashboardTokens.accent,
                border: `1px solid ${dashboardTokens.accentSoft}`,
                fontWeight: 700,
              }}
            />
            <Chip
              label={`แท็ก ${allTags.length}`}
              sx={{
                bgcolor: dashboardTokens.surfaceMuted,
                color: dashboardTokens.textMuted,
                border: `1px solid ${dashboardTokens.border}`,
                fontWeight: 700,
              }}
            />
            <Chip
              label={`ผู้แต่ง ${allAuthors.length}`}
              sx={{
                bgcolor: dashboardTokens.surfaceMuted,
                color: dashboardTokens.textMuted,
                border: `1px solid ${dashboardTokens.border}`,
                fontWeight: 700,
              }}
            />
            <Link href="/dashboard/admin/manga/create" style={{ textDecoration: "none" }}>
              <Button sx={dashboardPrimaryButtonSx}>
                + เพิ่มมังงะใหม่
              </Button>
            </Link>
          </Stack>
        </Stack>
      </DashboardSurface>

      <MangaDataTable
        initialMangas={mangas}
        allCategories={allCategories}
        allTags={allTags}
        allAuthors={allAuthors}
      />
    </Box>
  );
}

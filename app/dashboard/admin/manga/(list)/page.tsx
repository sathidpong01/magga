import MangaListControls from "../MangaListControls";
import { adminPageQuery, type AdminSearchParams } from "@/lib/admin-pagination";
import { readAdminManga } from "@/lib/admin-lists";
import { requireAdminPage } from "@/lib/auth-helpers";
import type { Metadata } from "next";

import { Box } from "@mui/material";
import MangaListHeader from "@/app/components/dashboard/MangaListHeader";
import MangaDataTable from "../MangaDataTable";
import { mangaListPageSx } from "@/app/components/dashboard/manga-list-layout";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "จัดการมังงะ - MAGGA",
  description: "จัดการรายการมังงะบน MAGGA",
  openGraph: {
    title: "จัดการมังงะ - MAGGA",
    description: "จัดการรายการมังงะบน MAGGA",
  },
  twitter: {
    title: "จัดการมังงะ - MAGGA",
    description: "จัดการรายการมังงะบน MAGGA",
  },
};

export default async function AdminMangaPage({
  searchParams,
}: { searchParams?: Promise<AdminSearchParams> } = {}) {
  await requireAdminPage();
  const query = adminPageQuery(await searchParams);
  const result = await readAdminManga(query);
  const mangas = result.items;
  return (
    <Box sx={mangaListPageSx}>
      <MangaListHeader />
      <MangaListControls
        query={query}
        hasMore={result.hasMore}
        count={mangas.length}
      />
      <MangaDataTable
        key={`${query.page}:${query.limit}:${query.search}:${query.sort}:${query.status}`}
        initialMangas={mangas}
      />
      <MangaListControls
        query={query}
        hasMore={result.hasMore}
        count={mangas.length}
        pagination
      />
    </Box>
  );
}

import AdminListControls from "@/app/components/dashboard/AdminListControls";
import { adminPageQuery, type AdminSearchParams } from "@/lib/admin-pagination";
import { readAdminManga } from "@/lib/admin-lists";
import { requireAdminPage } from "@/lib/auth-helpers";
import type { Metadata } from "next";



import { Box } from "@mui/material";
import MangaListHeader from "@/app/components/dashboard/MangaListHeader";
import MangaDataTable from "../MangaDataTable";
import { mangaListPageSx, mangaSorts, mangaStatuses } from "@/app/components/dashboard/manga-list-layout";

export const dynamic = "force-dynamic";

const ADMIN_MANGA_LIMIT = 200;
const ADMIN_METADATA_LIMIT = 500;

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
    <Box
      sx={mangaListPageSx}
    >
      <MangaListHeader count={mangas.length} />
      <AdminListControls compactSpacing
        query={query}
        hasMore={result.hasMore}
        count={mangas.length}
        sorts={mangaSorts}
        statuses={mangaStatuses}
      />
      <MangaDataTable
        initialMangas={mangas}
      />
    </Box>
  );
}

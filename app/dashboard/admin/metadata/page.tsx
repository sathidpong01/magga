import AdminListControls from "@/app/components/dashboard/AdminListControls";
import { adminPageQuery,type AdminSearchParams } from "@/lib/admin-pagination";
import { readAdminOptions } from "@/lib/admin-lists";
import { requireAdminPage } from "@/lib/auth-helpers";
import type { Metadata } from "next";



import MetadataHeader from "@/app/components/dashboard/MetadataHeader";
import { Box } from "@mui/material";
import MetadataManager from "./MetadataManager";


export const dynamic="force-dynamic";

export const metadata: Metadata={
  title: "จัดการหมวดหมู่และแท็ก - MAGGA",
  description: "จัดการหมวดหมู่และแท็กบน MAGGA",
  openGraph: {
    title: "จัดการหมวดหมู่และแท็ก - MAGGA",
    description: "จัดการหมวดหมู่และแท็กบน MAGGA",
  },
  twitter: {
    title: "จัดการหมวดหมู่และแท็ก - MAGGA",
    description: "จัดการหมวดหมู่และแท็กบน MAGGA",
  },
};

export default async function MetadataPage({
  searchParams,
}: { searchParams?: Promise<AdminSearchParams> }={}) {
  await requireAdminPage();
  const params=await searchParams;
  const tab=params?.tab==="tags"? "tags":"categories";
  const query=adminPageQuery(params);
  const result=await readAdminOptions(tab,query);
  const categories=tab==="categories"? result.items:[],
    tags=tab==="tags"? result.items:[];
  return (
    <Box
      sx={{
        maxWidth: 1600,
        mx: "auto",
        px: { xs: 0,md: 0.5 },
        py: { xs: 1,md: 0.5 },
      }}
    >
      <MetadataHeader />
      <AdminListControls
        query={query}
        hasMore={result.hasMore}
        count={result.items.length}
      />
      <MetadataManager
        initialTab={tab==="tags"? 1:0}
        initialCategories={categories}
        initialTags={tags}
      />
    </Box>
  );
}

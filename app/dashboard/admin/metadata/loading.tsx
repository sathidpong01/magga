"use client";
import { Box } from "@mui/material";
import { useSearchParams } from "next/navigation";
import AdminListControls from "@/app/components/dashboard/AdminListControls";
import MetadataHeader from "@/app/components/dashboard/MetadataHeader";
import { adminPageQuery } from "@/lib/admin-pagination";
import MetadataManager from "./MetadataManager";
export default function MetadataLoading() {
  const params=useSearchParams();
  const query=adminPageQuery(Object.fromEntries(params));
  return <Box sx={{ maxWidth: 1600,mx: "auto",px: { xs: 0,md: 0.5 },py: { xs: 1,md: 0.5 } }}>
    <MetadataHeader />
    <AdminListControls loading query={query} hasMore={false} count={0} />
    <MetadataManager loading loadingCount={query.limit} initialTab={params.get("tab")==="tags"? 1:0} initialCategories={[]} initialTags={[]} />
  </Box>;
}

import AdminListControls from "@/app/components/dashboard/AdminListControls";
import { adminPageQuery,type AdminSearchParams } from "@/lib/admin-pagination";
import { readAdminUsers } from "@/lib/admin-lists";
import { requireAdminPage } from "@/lib/auth-helpers";
import type { Metadata } from "next";


import UserManager from "./UserManager";
import { Box } from "@mui/material";

import DirectoryListHeader from "@/app/components/dashboard/DirectoryListHeader";
import { userSorts,userStatuses } from "@/app/components/dashboard/directory-list-layout";

export const dynamic="force-dynamic";

export const metadata: Metadata={
  title: "จัดการผู้ใช้ - MAGGA",
  description: "จัดการผู้ใช้และสิทธิ์บน MAGGA",
  openGraph: {
    title: "จัดการผู้ใช้ - MAGGA",
    description: "จัดการผู้ใช้และสิทธิ์บน MAGGA",
  },
  twitter: {
    title: "จัดการผู้ใช้ - MAGGA",
    description: "จัดการผู้ใช้และสิทธิ์บน MAGGA",
  },
};

export default async function UsersPage({
  searchParams,
}: { searchParams?: Promise<AdminSearchParams> }={}) {
  await requireAdminPage();
  const query=adminPageQuery(await searchParams);
  const result=await readAdminUsers(query);
  const users=result.items;


  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
      }}
    >
      <DirectoryListHeader kind="users" count={users.length} />
      <AdminListControls compactSpacing
        query={query}
        hasMore={result.hasMore}
        count={users.length}
        sorts={userSorts}
        statuses={userStatuses}
      />
      <UserManager initialUsers={users as any} />
    </Box>
  );
}

import prisma from "@/lib/prisma";
import { Box, Typography } from "@mui/material";
import Link from "next/link";
import MangaDataTable from "./MangaDataTable";

export const dynamic = "force-dynamic";

export default async function AdminMangaPage() {
  const mangas = await prisma.manga.findMany({
    include: {
      category: true,
      tags: true,
      author: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const allCategories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const allTags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
  });

  const allAuthors = await prisma.author.findMany({
    orderBy: { name: "asc" },
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

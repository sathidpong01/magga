import prisma from "@/lib/prisma";
import { Box } from "@mui/material";
import MetadataManager from "./MetadataManager";

export default async function MetadataPage() {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <Box>
      <MetadataManager initialCategories={categories} initialTags={tags} />
    </Box>
  );
}

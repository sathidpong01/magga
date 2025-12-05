import prisma from "@/lib/prisma";
import { Box } from "@mui/material";
import MetadataManager from "../components/MetadataManager";

export default async function MetadataPage() {
  const categories = await prisma.category.findMany({
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

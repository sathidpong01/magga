import { db } from "@/db";
import { categories as categoriesTable, tags as tagsTable } from "@/db/schema";
import { asc } from "drizzle-orm";
import { Box } from "@mui/material";
import MetadataManager from "./MetadataManager";

export default async function MetadataPage() {
  const categories = await db.query.categories.findMany({
    columns: { id: true, name: true },
    orderBy: [asc(categoriesTable.name)],
  });

  const tags = await db.query.tags.findMany({
    orderBy: [asc(tagsTable.name)],
  });

  return (
    <Box>
      <MetadataManager initialCategories={categories} initialTags={tags} />
    </Box>
  );
}

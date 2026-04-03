import { db } from "@/db";
import { categories as categoriesTable, tags as tagsTable } from "@/db/schema";
import { asc } from "drizzle-orm";
import { Box, Stack, Typography } from "@mui/material";
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
    <Box
      sx={{
        maxWidth: 1600,
        mx: "auto",
        px: { xs: 0, md: 0.5 },
        py: { xs: 1, md: 0.5 },
      }}
    >
      <Stack spacing={0.75} sx={{ mb: 3 }}>
        <Typography
          variant="overline"
          sx={{
            color: "#FABF06",
            fontWeight: 800,
            letterSpacing: "0.18em",
            lineHeight: 1,
          }}
        >
          WORKSPACE
        </Typography>
        <Typography
          variant="h4"
          sx={{
            color: "#fafafa",
            fontWeight: 900,
            letterSpacing: "-0.03em",
          }}
        >
          จัดการเมตาดาต้า
        </Typography>
        <Typography sx={{ color: "#a3a3a3", maxWidth: 720 }}>
          จัดระเบียบหมวดหมู่และแท็กจากพื้นที่ทำงานเดียวให้สอดคล้องกับหน้าผู้ดูแลอื่น
        </Typography>
      </Stack>
      <MetadataManager initialCategories={categories} initialTags={tags} />
    </Box>
  );
}

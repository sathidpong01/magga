"use server";

import { db } from "@/db";
import { authors as authorsTable } from "@/db/schema";
import { asc } from "drizzle-orm";
import AuthorManager from "./AuthorManager";
import { Box, Typography } from "@mui/material";

export default async function AuthorsPage() {
  const authors = await db.query.authors.findMany({
    orderBy: [asc(authorsTable.name)],
  });

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        จัดการผู้แต่ง
      </Typography>
      <AuthorManager initialAuthors={authors as any} />
    </Box>
  );
}

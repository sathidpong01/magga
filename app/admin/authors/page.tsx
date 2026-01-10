"use server";

import prisma from "@/lib/prisma";
import AuthorManager from "./AuthorManager";
import { Box, Typography } from "@mui/material";

export default async function AuthorsPage() {
  const authors = await prisma.author.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        จัดการผู้แต่ง
      </Typography>
      <AuthorManager initialAuthors={authors} />
    </Box>
  );
}

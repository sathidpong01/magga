import { db } from "@/db";
import { authors as authorsTable } from "@/db/schema";
import { asc } from "drizzle-orm";
import AuthorManager from "./AuthorManager";
import { Box, Typography } from "@mui/material";
import { dashboardTokens } from "@/app/components/dashboard/system";

export const dynamic = "force-dynamic";

export default async function AuthorsPage() {
  const authors = await db.query.authors.findMany({
    orderBy: [asc(authorsTable.name)],
  });

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 900, letterSpacing: "-0.03em", color: dashboardTokens.text, mb: 0.75 }}
        >
          จัดการผู้แต่ง
        </Typography>
        <Typography sx={{ color: dashboardTokens.textMuted }}>
          ดู เพิ่ม แก้ไข และลบข้อมูลผู้แต่งในรูปแบบ workspace เดียวกัน
        </Typography>
      </Box>
      <AuthorManager initialAuthors={authors as any} />
    </Box>
  );
}

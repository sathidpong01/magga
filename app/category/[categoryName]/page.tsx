import { notFound } from "next/navigation";
import { Container, Grid, Typography, Box, Button } from "@mui/material";
import Link from "next/link";
import CloseIcon from "@mui/icons-material/Close";
import MangaCard from "@/app/components/features/manga/MangaCard";
import { getMangasByCategoryName } from "@/lib/manga-list";
import { maggaColors } from "@/lib/design-tokens";
import type { Metadata } from "next";

type CategoryPageProps = {
  params: Promise<{
    categoryName: string;
  }>;
};

// ISR: Revalidate every 1 hour
export const revalidate = 3600;

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { categoryName: encodedCategoryName } = await params;
  const categoryName = decodeURIComponent(encodedCategoryName);
  const category = await getMangasByCategoryName(categoryName);
  const title = `หมวดหมู่: ${categoryName} - MAGGA`;
  const description = `รวมการ์ตูนหมวด ${categoryName} ที่อ่านได้บน MAGGA`;
  const canonical = `/category/${encodeURIComponent(categoryName)}`;
  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: Boolean(category?.mangas.length), follow: true },
    openGraph: { title, description, url: canonical },
    twitter: { title, description },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { categoryName: encodedCategoryName } = await params;
  const categoryName = decodeURIComponent(encodedCategoryName);

  const category = await getMangasByCategoryName(categoryName);

  if (!category) {
    notFound();
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 3.5 } }}>
      {/* Breadcrumbs matching Tailspace style */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          mb: 2,
          fontSize: "0.88rem",
        }}
      >
        <Link
          href="/"
          style={{
            color: maggaColors.archiveGoldHover,
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          หน้าแรก
        </Link>
        <Typography
          component="span"
          sx={{ color: maggaColors.textMuted, fontSize: "0.85rem", userSelect: "none" }}
        >
          &gt;
        </Typography>
        <Typography
          component="span"
          sx={{ color: maggaColors.textSecondary, fontSize: "0.88rem" }}
        >
          หมวดหมู่
        </Typography>
        <Typography
          component="span"
          sx={{ color: maggaColors.textMuted, fontSize: "0.85rem", userSelect: "none" }}
        >
          &gt;
        </Typography>
        <Typography
          component="span"
          sx={{ color: maggaColors.textPrimary, fontWeight: 600, fontSize: "0.88rem" }}
        >
          {category.name}
        </Typography>
      </Box>

      {/* Tailspace Hero Card */}
      <Box
        sx={{
          bgcolor: "#17181c",
          border: `1px solid rgba(255, 255, 255, 0.08)`,
          borderRadius: "14px",
          p: { xs: 2.5, sm: 3 },
          mb: 3.5,
          boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.4)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "1.6rem", sm: "2rem" },
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "-0.01em",
              }}
            >
              {category.name}
            </Typography>

            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                px: 1.4,
                py: 0.35,
                borderRadius: "9999px",
                fontSize: "0.78rem",
                fontWeight: 500,
                border: "1px solid rgba(245, 158, 11, 0.4)",
                color: "#fbbf24",
                bgcolor: "rgba(245, 158, 11, 0.08)",
              }}
            >
              หมวดหมู่
            </Box>
          </Box>

          <Link href="/" style={{ textDecoration: "none" }}>
            <Button
              size="small"
              startIcon={<CloseIcon sx={{ fontSize: "1rem" }} />}
              sx={{
                color: maggaColors.textSecondary,
                bgcolor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "9999px",
                px: 1.6,
                py: 0.5,
                fontSize: "0.8rem",
                textTransform: "none",
                fontWeight: 500,
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                },
              }}
            >
              แสดงผลงานทั้งหมด
            </Button>
          </Link>
        </Box>

        <Typography
          sx={{
            color: maggaColors.textSecondary,
            fontSize: "0.88rem",
            mt: 1,
          }}
        >
          พบทั้งหมด {category.mangas.length} เรื่อง ในหมวดหมู่นี้
        </Typography>
        <Typography variant="body2" sx={{ color: maggaColors.textSecondary, mt: 0.5 }}>
          รวมการ์ตูนหมวด {category.name} ที่อ่านได้บน MAGGA
        </Typography>
      </Box>

      {/* Manga Grid */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
        {category.mangas.map((manga) => (
          <Grid key={manga.id} size={{ xs: 6, sm: 4, md: 3, lg: 2.4 }}>
            <MangaCard manga={manga} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

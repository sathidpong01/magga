import { notFound } from "next/navigation";
import { Container, Grid, Typography, Box, Button } from "@mui/material";
import Link from "next/link";
import CloseIcon from "@mui/icons-material/Close";
import MangaCard from "@/app/components/features/manga/MangaCard";
import { getMangasByTagName } from "@/lib/manga-list";
import { maggaColors } from "@/lib/design-tokens";

type TagPageProps = {
  params: Promise<{
    tagName: string;
  }>;
};

// ISR: Revalidate every 1 hour
export const revalidate = 3600;

export async function generateMetadata({ params }: TagPageProps) {
  const { tagName: encodedTagName } = await params;
  const tagName = decodeURIComponent(encodedTagName);
  return {
    title: `แท็ก: ${tagName} - MAGGA`,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tagName: encodedTagName } = await params;
  const tagName = decodeURIComponent(encodedTagName);

  const tag = await getMangasByTagName(tagName);

  if (!tag) {
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
          แท็ก
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
          {tag.name}
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
              {tag.name}
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
                border: "1px solid rgba(16, 185, 129, 0.4)",
                color: "#34d399",
                bgcolor: "rgba(16, 185, 129, 0.08)",
              }}
            >
              แท็ก
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
          พบทั้งหมด {tag.mangas.length} เรื่อง ที่ติดแท็กนี้
        </Typography>
      </Box>

      {/* Manga Grid */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
        {tag.mangas.map((manga) => (
          <Grid key={manga.id} size={{ xs: 6, sm: 4, md: 3, lg: 2.4 }}>
            <MangaCard manga={manga} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

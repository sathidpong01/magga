import { notFound } from "next/navigation";
import { Container, Grid, Typography, Box, Breadcrumbs } from "@mui/material";
import Link from "next/link";
import HomeIcon from "@mui/icons-material/Home";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
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
    <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 4 } }}>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" sx={{ color: maggaColors.textMuted }} />}
        sx={{ mb: 2.5 }}
      >
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", color: maggaColors.archiveGold, textDecoration: "none", fontSize: "0.875rem" }}
        >
          <HomeIcon sx={{ fontSize: 16, mr: 0.5 }} />
          หน้าแรก
        </Link>
        <Typography sx={{ color: maggaColors.textMuted, fontSize: "0.875rem" }}>
          แท็ก
        </Typography>
        <Typography sx={{ color: "#fafafa", fontSize: "0.875rem" }}>
          {tag.name}
        </Typography>
      </Breadcrumbs>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
          แท็ก: {tag.name}
        </Typography>
        <Typography variant="body2" sx={{ color: maggaColors.textMuted, mt: 0.5 }}>
          พบทั้งหมด {tag.mangas.length} เรื่อง
        </Typography>
      </Box>

      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
        {tag.mangas.map((manga) => (
          <Grid key={manga.id} size={{ xs: 6, sm: 6, md: 4, lg: 3 }}>
            <MangaCard manga={manga} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

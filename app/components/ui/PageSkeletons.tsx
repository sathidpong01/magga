import { Box, Container, Grid, Skeleton, Stack } from "@mui/material";
import { maggaColors, maggaRadii, maggaLayout } from "@/lib/design-tokens";
import MangaGridSkeleton from "@/app/components/features/manga/MangaGridSkeleton";

export function SkeletonLine({ width = "100%", height = 20 }: { width?: number | string; height?: number | string }) {
  return <Skeleton variant="rectangular" width={width} height={height} sx={{ maxWidth: "100%", borderRadius: "4px", bgcolor: maggaColors.border }} />;
}

export function HomeSkeleton({ author, resume = true }: { author?: string; resume?: boolean }) {
  return <Container maxWidth="xl"><Box sx={{ my: 1 }} data-skeleton="home">
    {author ? <Box sx={{ mb: 3.5 }}>
      <SkeletonLine width={220} height={24.64} />
      <Box sx={{ mt: 1.75, p: { xs: 2.5, sm: 3 }, bgcolor: maggaColors.surface, border: `1px solid ${maggaColors.border}`, borderRadius: `${maggaRadii.card}px` }}>
        <Box sx={{ height: { xs: 44.8, sm: 56 } }}><SkeletonLine width={300} height="100%" /></Box>
        <Box sx={{ mt: 1 }}><SkeletonLine width={180} height={24} /></Box>
        <Box sx={{ mt: 2 }}><SkeletonLine width={200} height={36} /></Box>
      </Box>
    </Box> : <Box sx={{ mb: 1.5 }}>
      <SkeletonLine width={200} height={35} />
      <Box sx={{ height: { xs: 49, sm: 24.5 } }}><Skeleton variant="rectangular" width="100%" height="100%" sx={{ maxWidth: 450 }} /></Box>
    </Box>}
    {!author && resume && <Box className="magga-continue-slot" aria-hidden />}
    <Box sx={{ mb: 3.5, maxWidth: 680, mx: "auto", height: { xs: 62, sm: 66 } }}><Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: "12px" }} /></Box>
    <MangaGridSkeleton />
  </Box></Container>;
}

export function TaxonomySkeleton({ category = false }: { category?: boolean }) {
  return <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 3.5 } }} data-skeleton="taxonomy">
    <Box sx={{ mb: 2 }}><SkeletonLine width={260} height={24.64} /></Box>
    <Box sx={{ mb: 3.5, p: { xs: 2.5, sm: 3 }, bgcolor: maggaColors.surface, border: `1px solid ${maggaColors.border}`, borderRadius: "14px" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <Box sx={{ height: { xs: 44.8, sm: 56 }, width: 280, maxWidth: "100%" }}><Skeleton variant="rectangular" width="100%" height="100%" /></Box><SkeletonLine width={164} height={32} />
      </Box>
      <Box sx={{ mt: 1 }}><SkeletonLine width={280} height={24.64} /></Box>
      <Box sx={{ mt: 0.5, height: { xs: category ? 49 : 24.5, sm: 24.5 } }}><Skeleton variant="rectangular" width="100%" height="100%" sx={{ maxWidth: 400 }} /></Box>
    </Box>
    <MangaGridSkeleton count={10} taxonomy />
  </Container>;
}

export function AccountSkeleton({ profile = false }: { profile?: boolean }) {
  if (profile) return <ProfileSkeleton />;
  return <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }} data-skeleton={profile ? "profile" : "settings"}>
    <Box sx={{ mb: 3 }}><SkeletonLine width={240} height={24} /></Box>
    <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 4, pb: 3, borderBottom: `1px solid ${maggaColors.border}` }}>
      <Skeleton variant="circular" width={profile ? 80 : 60} height={profile ? 80 : 60} sx={{ flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}><SkeletonLine width={230} height={59.5} /><Box sx={{ mt: 0.5 }}><SkeletonLine width={450} height={40} /></Box></Box>
    </Box>
    {(profile ? [2] : [5, 1, 2]).map((count, section) => <Box key={section} sx={{ mb: 3 }}>
      <Box sx={{ mb: 1.5 }}><SkeletonLine width={160} height={20} /></Box>
      <Stack spacing={1.25}>{Array.from({ length: count }, (_, i) => <Box key={i} sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, bgcolor: maggaColors.surface, border: `1px solid ${maggaColors.border}`, borderRadius: "12px", minHeight: 74 }}>
        <Skeleton variant="circular" width={40} height={40} sx={{ flexShrink: 0 }} /><Box sx={{ flex: 1, minWidth: 0 }}><SkeletonLine width={100} height={16} /><Box sx={{ mt: 0.5 }}><SkeletonLine width="65%" height={24} /></Box></Box>
      </Box>)}</Stack>
    </Box>)}
  </Container>;
}

export function ReaderHeroSkeleton() {
  return <Box sx={{ position: "relative", overflow: "hidden" }} data-skeleton="reader-hero">
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ display: "grid", gridTemplateColumns: maggaLayout.readerHero.columns, gridTemplateRows: maggaLayout.readerHero.rows, columnGap: maggaLayout.readerHero.columnGap, rowGap: maggaLayout.readerHero.rowGap, alignItems: "start" }}>
        <Box sx={{ gridRow: { md: "1 / span 2" } }}>
          <Box sx={{ width: "100%", maxWidth: 256, aspectRatio: "3/4", borderRadius: `${maggaRadii.card}px`, overflow: "hidden", bgcolor: maggaColors.surface }}><Skeleton variant="rectangular" width="100%" height="100%" /></Box>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ height: { xs: 75.6, sm: 100.8, md: 78.4 }, mb: 1 }}><Skeleton variant="rectangular" width="90%" height="100%" /></Box>
          <Box sx={{ mb: 0.5 }}><SkeletonLine width="65%" height={20} /></Box>
          <SkeletonLine width={110} height={18} />
          <SkeletonLine width={190} height={24} />
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", my: 1 }}><SkeletonLine width={128} height={44} /><SkeletonLine width={44} height={44} /></Box>
        </Box>
        <Box sx={{ gridColumn: { xs: "1 / -1", md: "2" }, minWidth: 0 }}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.25 }}>{[50, 55, 60, 55, 50].map((width, index) => <SkeletonLine key={index} width={width} height={32} />)}</Box>
          <SkeletonLine width={120} height={20} />
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>{[92, 108, 80].map(width => <SkeletonLine key={width} width={width} height={44} />)}</Box>
        </Box>
      </Box>
    </Container>
  </Box>;
}

function ProfileSkeleton() {
  return <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }} data-skeleton="profile">
    <Box sx={{ mb: 3 }}><SkeletonLine width={240} height={24} /></Box>
    <Box sx={{ mb: 3, borderRadius: "14px", border: `1px solid ${maggaColors.border}`, bgcolor: maggaColors.surface, overflow: "hidden" }}>
      <Box sx={{ px: { xs: 2.5, sm: 3.5 }, pt: { xs: 2.8, sm: 3.5 }, pb: { xs: 2.4, sm: 3 } }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2.5, alignItems: { xs: "flex-start", sm: "center" } }}>
          <Skeleton variant="circular" width={104} height={104} sx={{ flexShrink: 0 }} />
          <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}><SkeletonLine width={230} height={59.5} /><Box sx={{ mt: 0.75 }}><SkeletonLine width={400} height={25} /></Box><Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}><SkeletonLine width={140} height={34} /><SkeletonLine width={180} height={34} /></Box></Box>
        </Box>
      </Box>
    </Box>
    <SkeletonLine width={380} height={20} />
  </Container>;
}

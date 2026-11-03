"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Skeleton, Typography } from "@mui/material";
import { maggaColors, maggaRadii, maggaTypography } from "@/lib/design-tokens";
import MangaCard, { type MangaWithDetails } from "./MangaCard";

const gridSx = {
  display: "grid",
  gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, minmax(0, 1fr))" },
  gap: { xs: 1.5, sm: 2 },
  alignContent: "start",
  gridArea: "1 / 1",
  minWidth: 0,
};
const coverSizes = "(max-width: 599px) calc((100vw - 44px) / 2), (max-width: 1199px) calc((100vw - 96px) / 4), 238px";

export default function RelatedManga({ mangaId }: { mangaId: string }) {
  return <RelatedMangaBoundary key={mangaId} mangaId={mangaId} />;
}

function RelatedMangaBoundary({ mangaId }: { mangaId: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [mangas, setMangas] = useState<MangaWithDetails[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!host.current) return;
    if (!("IntersectionObserver" in window)) {
      setActive(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      setActive(true);
    }, { rootMargin: "400px 0px" });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/manga/${mangaId}/related`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!Array.isArray(data.mangas)) throw new Error();
        if (!controller.signal.aborted) setMangas(data.mangas.slice(0, 4));
      } catch {
        if (!controller.signal.aborted) setError("โหลดเรื่องที่เกี่ยวข้องไม่ได้ กรุณาลองใหม่");
      }
    }
    void load();
    return () => controller.abort();
  }, [active, attempt, mangaId]);

  const pending = mangas === null && !error;
  return (
    <Box ref={host} component="section" aria-label="เรื่องที่เกี่ยวข้อง" sx={{ mt: 3 }}>
      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
        เรื่องที่เกี่ยวข้อง
      </Typography>
      <Box aria-busy={active && pending} sx={{ display: "grid" }}>
        {/* Keep the same four slots for loading, sparse results, empty and error states. */}
        <Box aria-hidden="true" sx={{ ...gridSx, visibility: pending ? "visible" : "hidden" }}>
          {[0, 1, 2, 3].map((index) => (
            <Box key={index}>
              <Skeleton variant="rectangular" animation={active && pending ? "pulse" : false}
                sx={{ aspectRatio: "3 / 4", height: "auto", borderRadius: `${maggaRadii.card}px`, bgcolor: maggaColors.surface }} />
              <Box sx={{ pt: 1, px: 0.25, pb: 0.5, display: "flex", flexDirection: "column", gap: 0.35 }}>
                <Skeleton variant="rectangular" animation={false} height={maggaTypography.cardTitleHeight} width="85%" />
                <Skeleton variant="rectangular" animation={false} height={maggaTypography.cardAuthorHeight} width="60%" />
                <Skeleton variant="rectangular" animation={false} height={maggaTypography.cardStatsHeight} width="70%" sx={{ mt: 0.15 }} />
              </Box>
            </Box>
          ))}
        </Box>
        {mangas && mangas.length > 0 && (
          <Box sx={gridSx}>
            {mangas.map((manga) => <MangaCard key={manga.id} manga={manga} imageSizes={coverSizes} />)}
          </Box>
        )}
        <Box role="status" sx={{ gridArea: "1 / 1", alignSelf: "start", minWidth: 0 }}>
          {error && (
            <Alert severity="error" action={
              <Button color="inherit" onClick={() => { setError(""); setAttempt((value) => value + 1); }} sx={{ minHeight: 44 }}>ลองใหม่</Button>
            }>{error}</Alert>
          )}
          {mangas?.length === 0 && <Typography color="text.secondary">ยังไม่มีเรื่องที่เกี่ยวข้อง</Typography>}
        </Box>
      </Box>
    </Box>
  );
}

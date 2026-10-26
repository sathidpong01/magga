"use client";
import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Grid, Typography } from "@mui/material";
import MangaCard, { type MangaWithDetails } from "./MangaCard";
export default function RelatedManga({ mangaId }: { mangaId: string }) {
  const [mangas, setMangas] = useState<MangaWithDetails[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), [mangaId]);
  async function load() {
    if (controller.current) return;
    const request = new AbortController();
    controller.current = request;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/manga/${mangaId}/related`, {
        signal: request.signal,
        cache: "no-store",
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (!Array.isArray(data.mangas)) throw new Error();
      setMangas(data.mangas);
    } catch {
      if (!request.signal.aborted)
        setError("โหลดเรื่องที่เกี่ยวข้องไม่ได้ กรุณาลองใหม่");
    } finally {
      if (!request.signal.aborted) setLoading(false);
      controller.current = null;
    }
  }
  return (
    <Box sx={{ mt: 3 }}>
      {mangas === null && (
        <Button
          onClick={() => void load()}
          disabled={loading}
          sx={{ minHeight: 44 }}
        >
          {loading ? "กำลังโหลด..." : "ดูเรื่องที่เกี่ยวข้อง"}
        </Button>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      {mangas && (
        <>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            เรื่องที่เกี่ยวข้อง
          </Typography>
          {mangas.length ? (
            <Grid container spacing={2}>
              {mangas.map((manga) => (
                <Grid key={manga.id} size={{ xs: 6, md: 3 }}>
                  <MangaCard manga={manga} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography color="text.secondary">
              ยังไม่มีเรื่องที่เกี่ยวข้อง
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}

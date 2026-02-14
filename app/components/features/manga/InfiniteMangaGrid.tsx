"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Grid, Box, CircularProgress } from "@mui/material";
import MangaCard, { MangaWithDetails } from "./MangaCard";
import { AdCard } from "@/app/components/features/ads";
import EmptyState from "@/app/components/ui/EmptyState";

interface Ad {
  id: string;
  type: string;
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
  content?: string | null;
  repeatCount?: number;
}

interface InfiniteMangaGridProps {
  initialMangas: MangaWithDetails[];
  initialHasMore: boolean;
  ads?: Ad[];
  search?: string;
  categoryId?: string;
  tags?: string;
  sort?: string;
}

export default function InfiniteMangaGrid({
  initialMangas,
  initialHasMore,
  ads = [],
  search,
  categoryId,
  tags,
  sort,
}: InfiniteMangaGridProps) {
  const [mangas, setMangas] = useState<MangaWithDetails[]>(initialMangas);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Reset when filters change
  useEffect(() => {
    setMangas(initialMangas);
    setPage(1);
    setHasMore(initialHasMore);
  }, [initialMangas, initialHasMore]);

  // Fetch more mangas
  const fetchMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page + 1));
      if (search) params.set("search", search);
      if (categoryId && categoryId !== "all")
        params.set("categoryId", categoryId);
      if (tags) params.set("tags", tags);
      if (sort) params.set("sort", sort);

      const res = await fetch(`/api/manga/list?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setMangas((prev) => [...prev, ...data.mangas]);
      setPage((p) => p + 1);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Error fetching more mangas:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, hasMore, isLoading, search, categoryId, tags, sort]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchMore();
        }
      },
      { rootMargin: "400px" },
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [fetchMore, hasMore, isLoading]);

  // สร้าง items พร้อม ads แทรก
  const itemsWithAds = (() => {
    if (ads.length === 0) {
      return mangas.map((manga) => ({ type: "manga" as const, data: manga }));
    }

    // ขยาย ads ตาม repeatCount
    const expandedAds: Ad[] = [];
    ads.forEach((ad) => {
      const count = ad.repeatCount || 1;
      for (let i = 0; i < count; i++) {
        expandedAds.push(ad);
      }
    });

    const items: Array<
      | { type: "manga"; data: MangaWithDetails }
      | { type: "ad"; data: Ad; index: number }
    > = [];

    let mangaIndex = 0;
    let adIndex = 0;
    let totalIndex = 0;

    while (mangaIndex < mangas.length) {
      // แทรก ad ที่ตำแหน่ง 9, 19, 29... (ทุกๆ 10 หลังจากเริ่ม)
      if (
        adIndex < expandedAds.length &&
        totalIndex > 0 &&
        (totalIndex + 1) % 10 === 0
      ) {
        items.push({ type: "ad", data: expandedAds[adIndex], index: adIndex });
        adIndex++;
      } else {
        items.push({ type: "manga", data: mangas[mangaIndex] });
        mangaIndex++;
      }
      totalIndex++;
    }

    return items;
  })();

  if (mangas.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      {/* Add minHeight to prevent CLS when grid content loads */}
      <Grid container spacing={3} sx={{ minHeight: 400 * 3 }}>
        {itemsWithAds.map((item, index) => (
          <Grid
            key={
              item.type === "manga"
                ? item.data.id
                : `ad-${item.data.id}-${item.index}`
            }
            size={{ xs: 6, sm: 6, md: 4, lg: 3 }}
          >
            {item.type === "manga" ? (
              <MangaCard manga={item.data} priority={index < 4} />
            ) : (
              <AdCard ad={item.data} />
            )}
          </Grid>
        ))}
      </Grid>

      {/* Infinite scroll trigger */}
      <Box
        ref={loaderRef}
        sx={{
          display: "flex",
          justifyContent: "center",
          py: 4,
          minHeight: 60,
        }}
      >
        {isLoading && <CircularProgress size={32} sx={{ color: "#fbbf24" }} />}
      </Box>
    </>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Grid, Box, Button, CircularProgress } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MangaCard, { MangaWithDetails } from "./MangaCard";
import { AdCard } from "@/app/components/features/ads";
import EmptyState from "@/app/components/ui/EmptyState";
import { useSession } from "@/lib/auth-client";

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
  pageSize?: number;
  search?: string;
  categoryId?: string;
  tags?: string;
  sort?: string;
}

export default function InfiniteMangaGrid({
  initialMangas,
  initialHasMore,
  ads = [],
  pageSize = 12,
  search,
  categoryId,
  tags,
  sort,
}: InfiniteMangaGridProps) {
  const { data: session, isPending: isSessionPending } = useSession();
  const [blockedTagIds, setBlockedTagIds] = useState<string[]>([]);
  const [mangas, setMangas] = useState<MangaWithDetails[]>(initialMangas);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch blocked tags only when the session is known to avoid noisy 401s for guests.
  useEffect(() => {
    if (isSessionPending) {
      return;
    }

    if (!session?.user?.id) {
      setBlockedTagIds([]);
      return;
    }

    fetch("/api/user/blocked-tags")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const nextBlockedTagIds = Array.isArray(data?.blockedTags)
          ? data.blockedTags.map((t: any) => t.tagId)
          : [];
        setBlockedTagIds(nextBlockedTagIds);
      })
      .catch(() => {
        setBlockedTagIds([]);
      });
  }, [isSessionPending, session?.user?.id]);

  // Filter out manga that contain any blocked tag, and apply when blocked tags change
  const filteredMangas = blockedTagIds.length === 0
    ? mangas
    : mangas.filter((m) => !m.tags.some((t) => blockedTagIds.includes(t.id)));

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
      params.set("pageSize", String(pageSize));
      if (search) params.set("search", search);
      if (categoryId && categoryId !== "all")
        params.set("categoryId", categoryId);
      if (tags) params.set("tags", tags);
      if (sort) params.set("sort", sort);
      if (blockedTagIds.length > 0) params.set("excludeTagIds", blockedTagIds.join(","));

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
  }, [page, hasMore, isLoading, pageSize, search, categoryId, tags, sort, blockedTagIds]);

  // สร้าง items พร้อม ads แทรก
  const itemsWithAds = (() => {
    if (ads.length === 0) {
      return filteredMangas.map((manga) => ({ type: "manga" as const, data: manga }));
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

    while (mangaIndex < filteredMangas.length) {
      // แทรก ad ที่ตำแหน่ง 9, 19, 29... (ทุกๆ 10 หลังจากเริ่ม)
      if (
        adIndex < expandedAds.length &&
        totalIndex > 0 &&
        (totalIndex + 1) % 10 === 0
      ) {
        items.push({ type: "ad", data: expandedAds[adIndex], index: adIndex });
        adIndex++;
      } else {
        items.push({ type: "manga", data: filteredMangas[mangaIndex] });
        mangaIndex++;
      }
      totalIndex++;
    }

    return items;
  })();

  const totalItems = itemsWithAds.length;
  const orphanAtTwoColumns = totalItems % 2 === 1;
  const orphanAtThreeColumns = totalItems % 3 === 1;
  const orphanAtFourColumns = totalItems % 4 === 1;

  if (filteredMangas.length === 0 && !isLoading) {
    return <EmptyState />;
  }

  return (
    <>
      {/* Add minHeight to prevent CLS when grid content loads */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ minHeight: 400 * 3 }}>
        {itemsWithAds.map((item, index) => (
          <Grid
            key={
              item.type === "manga"
                ? item.data.id
                : `ad-${item.data.id}-${item.index}`
            }
            size={{ xs: 6, sm: 6, md: 4, lg: 3 }}
            sx={
              index === totalItems - 1
                ? {
                    mx: {
                      xs: orphanAtTwoColumns ? "auto" : undefined,
                      sm: orphanAtTwoColumns ? "auto" : undefined,
                      md: orphanAtThreeColumns ? "auto" : undefined,
                      lg: orphanAtFourColumns ? "auto" : undefined,
                    },
                  }
                : undefined
            }
          >
            {item.type === "manga" ? (
              <MangaCard manga={item.data} priority={index < 4} />
            ) : (
              <AdCard ad={item.data} />
            )}
          </Grid>
        ))}
      </Grid>

      {/* Load More button */}
      {hasMore && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <Button
            variant="outlined"
            onClick={fetchMore}
            disabled={isLoading}
            startIcon={
              isLoading ? (
                <CircularProgress size={18} sx={{ color: "#fbbf24" }} />
              ) : (
                <ExpandMoreIcon />
              )
            }
            sx={{
              borderColor: "rgba(251, 191, 36, 0.4)",
              color: "#fbbf24",
              borderRadius: 0.75,
              px: 4,
              py: 1,
              textTransform: "none",
              fontWeight: 600,
              "&:hover": {
                borderColor: "#fbbf24",
                bgcolor: "rgba(251, 191, 36, 0.08)",
              },
              "&.Mui-disabled": {
                borderColor: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.3)",
              },
            }}
          >
            {isLoading ? "กำลังโหลด..." : "โหลดเพิ่มเติม"}
          </Button>
        </Box>
      )}
    </>
  );
}

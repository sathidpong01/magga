"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Grid, Box, Button, CircularProgress, Alert } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MangaCard, { MangaWithDetails } from "./MangaCard";
import { AdCard } from "@/app/components/features/ads";
import { useAds } from "@/app/components/features/ads/AdsProvider";
import EmptyState from "@/app/components/ui/EmptyState";
import { useSession } from "@/lib/auth-client";
import { maggaColors } from "@/lib/design-tokens";
import { adDeviceDisplay } from "@/lib/advertisements";
import { appendUniqueMangas, buildMangaPageQuery } from "@/lib/manga-query";

interface Ad {
  id: string;
  type: string;
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
  linkUrls?: string[] | null;
  content?: string | null;
  repeatCount?: number;
  targetDevice?: string;
}

interface InfiniteMangaGridProps {
  initialMangas: MangaWithDetails[];
  initialHasMore: boolean;
  ads?: Ad[];
  pageSize?: number;
  search?: string;
  categoryId?: string;
  tags?: string[];
  sort?: string;
  author?: string;
}

export default function InfiniteMangaGrid({
  initialMangas,
  initialHasMore,
  pageSize = 12,
  search,
  categoryId,
  tags,
  sort,
  author,
}: InfiniteMangaGridProps) {
  const { getAdsByPlacement } = useAds();
  const ads = getAdsByPlacement("grid");
  const { data: session, isPending: isSessionPending } = useSession();
  const [blockedTagIds, setBlockedTagIds] = useState<string[]>([]);
  const [mangas, setMangas] = useState<MangaWithDetails[]>(initialMangas);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const listGeneration = useRef(0);
  const activeListRequest = useRef<AbortController | null>(null);
  const actorId = session?.user?.id;
  const scope = buildMangaPageQuery({ page: 1, pageSize, search, author, categoryId, tagNames: tags, sort }).toString();

  useEffect(() => {
    const controller = new AbortController();
    setBlockedTagIds([]);
    if (isSessionPending || !actorId) return () => controller.abort();
    fetch("/api/user/blocked-tags", { signal: controller.signal, cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (controller.signal.aborted) return;
        setBlockedTagIds(Array.isArray(data?.blockedTags)
          ? data.blockedTags.flatMap((tag: { tagId?: unknown }) => typeof tag.tagId === "string" ? [tag.tagId] : [])
          : []);
      })
      .catch(() => { if (!controller.signal.aborted) setBlockedTagIds([]); });
    return () => controller.abort();
  }, [isSessionPending, actorId]);

  const filteredMangas = blockedTagIds.length === 0
    ? mangas
    : mangas.filter((manga) => !manga.tags.some((tag) => blockedTagIds.includes(tag.id)));

  useEffect(() => {
    listGeneration.current++;
    activeListRequest.current?.abort();
    activeListRequest.current = null;
    setMangas(appendUniqueMangas([], initialMangas));
    setPage(1);
    setHasMore(initialHasMore);
    setLoadError("");
    setIsLoading(false);
    return () => { activeListRequest.current?.abort(); };
  }, [initialMangas, initialHasMore, scope]);

  useEffect(() => {
    listGeneration.current++;
    activeListRequest.current?.abort();
    activeListRequest.current = null;
    setIsLoading(false);
    setLoadError("");
  }, [actorId]);

  const fetchMore = useCallback(async () => {
    // A synchronous lock also covers double-clicks before React re-renders.
    if (activeListRequest.current || !hasMore) return;
    const controller = new AbortController();
    activeListRequest.current = controller;
    const generation = listGeneration.current;
    const nextPage = page + 1;
    setIsLoading(true);
    setLoadError("");
    try {
      // All pages use the same public dataset; blocked tags are filtered locally.
      const params = new URLSearchParams(scope);
      params.set("page", String(nextPage));
      const response = await fetch(`/api/manga/list?${params}`, { signal: controller.signal, cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      if (!Array.isArray(data.mangas) || typeof data.hasMore !== "boolean") throw new Error("Invalid list response");
      if (controller.signal.aborted || generation !== listGeneration.current) return;
      setMangas((previous) => appendUniqueMangas(previous, data.mangas));
      setPage(nextPage);
      setHasMore(data.hasMore);
    } catch {
      if (!controller.signal.aborted && generation === listGeneration.current) {
        setLoadError("โหลดรายการเพิ่มเติมไม่ได้ กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      if (activeListRequest.current === controller) activeListRequest.current = null;
      if (!controller.signal.aborted && generation === listGeneration.current) setIsLoading(false);
    }
  }, [page, hasMore, scope]);

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

  return (
    <>
      {filteredMangas.length === 0 && !isLoading && <EmptyState />}
      {/* Add minHeight to prevent CLS when grid content loads */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ minHeight: filteredMangas.length ? 400 * 3 : 0, alignContent: "start" }}>
        {itemsWithAds.map((item, index) => (
          <Grid
            key={
              item.type === "manga"
                ? item.data.id
                : `ad-${item.data.id}-${item.index}`
            }
            size={{ xs: 6, sm: 6, md: 4, lg: 3 }}
            sx={{
              display: item.type === "ad" ? adDeviceDisplay(item.data.targetDevice) : undefined,
              ...(index === totalItems - 1
                ? {
                    mx: {
                      xs: orphanAtTwoColumns ? "auto" : undefined,
                      sm: orphanAtTwoColumns ? "auto" : undefined,
                      md: orphanAtThreeColumns ? "auto" : undefined,
                      lg: orphanAtFourColumns ? "auto" : undefined,
                    },
                  }
                : {}),
            }}
          >
            {item.type === "manga" ? (
              <MangaCard manga={item.data} priority={index < 4} />
            ) : (
              <AdCard ad={item.data} />
            )}
          </Grid>
        ))}
      </Grid>

      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" disabled={isLoading} onClick={fetchMore}>ลองใหม่</Button>}>
          {loadError}
        </Alert>
      )}
      {/* Load More button */}
      {hasMore && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <Button
            variant="outlined"
            onClick={fetchMore}
            disabled={isLoading}
            startIcon={
              isLoading ? (
                <CircularProgress size={18} sx={{ color: maggaColors.archiveGold }} />
              ) : (
                <ExpandMoreIcon />
              )
            }
            sx={{
              borderColor: maggaColors.archiveGoldBorder,
              color: maggaColors.archiveGold,
              borderRadius: "8px",
              px: 4,
              py: 1,
              textTransform: "none",
              fontWeight: 500,
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: maggaColors.archiveGold,
                bgcolor: maggaColors.archiveGoldSoft,
                color: "#ffffff",
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

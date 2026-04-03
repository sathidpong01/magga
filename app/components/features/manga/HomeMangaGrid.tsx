"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import InfiniteMangaGrid from "./InfiniteMangaGrid";
import MangaGridSkeleton from "./MangaGridSkeleton";
import type { MangaWithDetails } from "./MangaCard";

interface Ad {
  id: string;
  type: string;
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
  content?: string | null;
  repeatCount?: number;
}

interface HomeMangaGridProps {
  search?: string;
  categoryId?: string;
  tagNames?: string[];
  sort?: string;
  ads: Ad[];
  pageSize?: number;
}

type MangaListResponse = {
  mangas: MangaWithDetails[];
  hasMore: boolean;
};

export default function HomeMangaGrid({
  search,
  categoryId,
  tagNames,
  sort,
  ads,
  pageSize = 12,
}: HomeMangaGridProps) {
  const [data, setData] = useState<MangaListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("pageSize", String(pageSize));
    if (search) params.set("search", search);
    if (categoryId && categoryId !== "all") params.set("categoryId", categoryId);
    if (tagNames && tagNames.length > 0) params.set("tags", tagNames.join(","));
    if (sort) params.set("sort", sort);
    return params.toString();
  }, [categoryId, pageSize, search, sort, tagNames]);

  useEffect(() => {
    const controller = new AbortController();

    setIsLoading(true);
    setError(null);

    fetch(`/api/manga/list?${queryString}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch manga list (${response.status})`);
        }
        return response.json() as Promise<MangaListResponse>;
      })
      .then((nextData) => {
        if (!controller.signal.aborted) {
          setData(nextData);
        }
      })
      .catch((nextError) => {
        if (!controller.signal.aborted) {
          console.error("Home manga grid bootstrap failed.", nextError);
          setData(null);
          setError("โหลดรายการมังงะไม่สำเร็จ");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [queryString, retryCount]);

  if (isLoading && !data) {
    return <MangaGridSkeleton count={pageSize} />;
  }

  if (error && !data) {
    return (
      <Box
        sx={{
          minHeight: 240,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          textAlign: "center",
        }}
      >
        <Typography variant="body1" color="text.secondary">
          {error}
        </Typography>
        <Button variant="outlined" onClick={() => setRetryCount((count) => count + 1)}>
          ลองใหม่
        </Button>
      </Box>
    );
  }

  return (
    <InfiniteMangaGrid
      initialMangas={data?.mangas ?? []}
      initialHasMore={data?.hasMore ?? false}
      ads={ads}
      pageSize={pageSize}
      search={search}
      categoryId={categoryId}
      tags={(tagNames ?? []).join(",")}
      sort={sort}
    />
  );
}

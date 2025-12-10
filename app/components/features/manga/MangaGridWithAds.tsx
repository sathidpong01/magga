"use client";

import { useMemo } from "react";
import { Grid } from "@mui/material";
import MangaCard from "@/app/components/features/manga/MangaCard";
import { AdCard } from "@/app/components/features/ads";
import type { Manga, Tag, Category } from "@prisma/client";

interface MangaWithDetails extends Manga {
  tags: Tag[];
  category: Category | null;
}

interface Ad {
  id: string;
  type: string;
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
  content?: string | null;
}

interface MangaGridWithAdsProps {
  mangas: MangaWithDetails[];
  ads?: Ad[]; // Now received from server
}

export default function MangaGridWithAds({
  mangas,
  ads = [],
}: MangaGridWithAdsProps) {
  // สุ่มตำแหน่งโฆษณาใน grid
  const itemsWithAds = useMemo(() => {
    if (ads.length === 0) {
      return mangas.map((manga) => ({ type: "manga" as const, data: manga }));
    }

    const items: Array<
      { type: "manga"; data: MangaWithDetails } | { type: "ad"; data: Ad }
    > = [];
    const usedPositions = new Set<number>();

    // สุ่มตำแหน่งสำหรับแต่ละโฆษณา (ห่างกันอย่างน้อย 4 ตำแหน่ง)
    const adPositions: number[] = [];
    ads.forEach((_, index) => {
      // สุ่มตำแหน่งระหว่าง 3-12 (ไม่ใช่ตำแหน่งแรกๆ)
      let pos: number;
      let attempts = 0;
      do {
        pos =
          Math.floor(Math.random() * Math.min(mangas.length, 15)) +
          3 +
          index * 5;
        attempts++;
      } while (usedPositions.has(pos) && attempts < 10);

      if (!usedPositions.has(pos) && pos < mangas.length + ads.length) {
        adPositions.push(pos);
        usedPositions.add(pos);
      }
    });

    let mangaIndex = 0;
    let adIndex = 0;

    for (
      let i = 0;
      i < mangas.length + ads.length && mangaIndex < mangas.length;
      i++
    ) {
      if (adPositions.includes(i) && adIndex < ads.length) {
        items.push({ type: "ad", data: ads[adIndex] });
        adIndex++;
      } else if (mangaIndex < mangas.length) {
        items.push({ type: "manga", data: mangas[mangaIndex] });
        mangaIndex++;
      }
    }

    return items;
  }, [mangas, ads]);

  return (
    <Grid container spacing={3}>
      {itemsWithAds.map((item) => (
        <Grid
          item
          key={item.type === "manga" ? item.data.id : `ad-${item.data.id}`}
          xs={12}
          sm={6}
          md={4}
          lg={3}
        >
          {item.type === "manga" ? (
            <MangaCard manga={item.data} />
          ) : (
            <AdCard ad={item.data} />
          )}
        </Grid>
      ))}
    </Grid>
  );
}

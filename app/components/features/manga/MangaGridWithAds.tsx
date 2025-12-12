"use client";

import { useMemo } from "react";
import { Grid } from "@mui/material";
import MangaCard, { MangaWithDetails } from "@/app/components/features/manga/MangaCard";
import { AdCard } from "@/app/components/features/ads";

interface Ad {
  id: string;
  type: string;
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
  content?: string | null;
  repeatCount?: number; // จำนวนครั้งที่แสดงซ้ำ
}

interface MangaGridWithAdsProps {
  mangas: MangaWithDetails[];
  ads?: Ad[]; // Now received from server
}

export default function MangaGridWithAds({
  mangas,
  ads = [],
}: MangaGridWithAdsProps) {
  // ใช้ตำแหน่งแบบ deterministic (ไม่สุ่ม) เพื่อหลีกเลี่ยง hydration mismatch
  const itemsWithAds = useMemo(() => {
    if (ads.length === 0) {
      return mangas.map((manga) => ({ type: "manga" as const, data: manga }));
    }

    // ขยาย ads ตาม repeatCount (เช่น repeatCount=3 จะได้ ad ตัวเดิม 3 ครั้ง)
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

    // วางโฆษณาที่ตำแหน่งคงที่: ทุกๆ 5 ตำแหน่ง เริ่มจากตำแหน่ง 4
    let mangaIndex = 0;
    let adIndex = 0;
    let totalIndex = 0;

    while (mangaIndex < mangas.length) {
      // แทรก ad ที่ตำแหน่ง 6, 13, 20... (ทุกๆ 10 หลังจากตำแหน่งที่ 6)
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
  }, [mangas, ads]);

  return (
    <Grid container spacing={3}>
      {itemsWithAds.map((item, index) => (
        <Grid
          item
          key={
            item.type === "manga"
              ? item.data.id
              : `ad-${item.data.id}-${item.index}`
          }
          xs={6}
          sm={6}
          md={4}
          lg={3}
        >
          {item.type === "manga" ? (
            <MangaCard manga={item.data} priority={index < 6} />
          ) : (
            <AdCard ad={item.data} />
          )}
        </Grid>
      ))}
    </Grid>
  );
}

import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { advertisements } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getAdvertisementLinks } from "./advertisements";

export const getPublicAds = unstable_cache(async () => {
  const ads = await db.query.advertisements.findMany({
    where: eq(advertisements.isActive, true),
    orderBy: [desc(advertisements.createdAt)],
    columns: {
      id: true, type: true, title: true, imageUrl: true, linkUrl: true, linkUrls: true,
      content: true, placement: true, repeatCount: true, targetDevice: true,
    },
  });
  return ads.map((ad) => ({
    id: ad.id, type: ad.type, title: ad.title, imageUrl: ad.imageUrl,
    linkUrl: ad.linkUrl, linkUrls: getAdvertisementLinks(ad), content: ad.content, placement: ad.placement,
    repeatCount: ad.repeatCount, targetDevice: ad.targetDevice,
  }));
}, ["public-advertisements-v3"], { revalidate: 300, tags: ["advertisements"] });

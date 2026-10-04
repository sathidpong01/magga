import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { advertisements } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const getPublicAds = unstable_cache(async () => {
  const ads = await db.query.advertisements.findMany({
    where: eq(advertisements.isActive, true),
    orderBy: [desc(advertisements.createdAt)],
    columns: {
      id: true, type: true, title: true, imageUrl: true, linkUrl: true,
      content: true, placement: true, repeatCount: true, targetDevice: true,
    },
  });
  return ads.map((ad) => ({
    id: ad.id, type: ad.type, title: ad.title, imageUrl: ad.imageUrl,
    linkUrl: ad.linkUrl, content: ad.content, placement: ad.placement,
    repeatCount: ad.repeatCount, targetDevice: ad.targetDevice,
  }));
}, ["public-advertisements-v2"], { revalidate: 300, tags: ["advertisements"] });

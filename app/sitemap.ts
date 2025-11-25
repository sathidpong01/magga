import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  // Get all manga slugs
  const mangas = await prisma.manga.findMany({
    select: {
      slug: true,
      updatedAt: true,
    },
  });

  const mangaUrls = mangas.map((manga) => ({
    url: `${baseUrl}/${manga.slug}`,
    lastModified: manga.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...mangaUrls,
  ];
}

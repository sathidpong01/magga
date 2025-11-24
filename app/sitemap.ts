import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  // Get all manga IDs
  const mangas = await prisma.manga.findMany({
    select: {
      id: true,
      updatedAt: true,
    },
  });

  const mangaUrls = mangas.map((manga) => ({
    url: `${baseUrl}/${manga.id}`,
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

import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || "https://magga.vercel.app";

  // Get all visible manga slugs
  const mangas = await prisma.manga.findMany({
    where: { isHidden: false },
    select: {
      slug: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  // Get all categories
  const categories = await prisma.category.findMany({
    select: { name: true },
  });

  // Get all tags
  const tags = await prisma.tag.findMany({
    select: { name: true },
  });

  // Manga pages
  const mangaUrls = mangas.map((manga) => ({
    url: `${baseUrl}/${encodeURIComponent(manga.slug)}`,
    lastModified: manga.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Category pages
  const categoryUrls = categories.map((cat) => ({
    url: `${baseUrl}/category/${encodeURIComponent(cat.name)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Tag pages
  const tagUrls = tags.map((tag) => ({
    url: `${baseUrl}/tag/${encodeURIComponent(tag.name)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/changelog`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    ...mangaUrls,
    ...categoryUrls,
    ...tagUrls,
  ];
}

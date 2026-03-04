import { MetadataRoute } from "next";
import { db } from "@/db";
import { manga as mangaTable, categories as categoriesTable, tags as tagsTable } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || "https://magga.vercel.app";

  // Get all visible manga slugs
  const mangas = await db
    .select({ slug: mangaTable.slug, updatedAt: mangaTable.updatedAt })
    .from(mangaTable)
    .where(eq(mangaTable.isHidden, false))
    .orderBy(desc(mangaTable.updatedAt));

  // Get all categories
  const categories = await db
    .select({ name: categoriesTable.name })
    .from(categoriesTable);

  // Get all tags
  const tags = await db
    .select({ name: tagsTable.name })
    .from(tagsTable);

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

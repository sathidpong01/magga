import { MetadataRoute } from "next";
import { db } from "@/db";
import { manga as mangaTable, categories as categoriesTable, mangaTags as mangaTagsTable, tags as tagsTable } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSiteUrl } from "@/lib/site-url";

// ISR: Regenerate sitemap every 1 hour
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  const mangas = await db
    .select({ slug: mangaTable.slug, updatedAt: mangaTable.updatedAt })
    .from(mangaTable)
    .where(eq(mangaTable.isHidden, false))
    .orderBy(desc(mangaTable.updatedAt));

  // Empty collection pages have no manga to discover, so leave them out.
  const categories = await db
    .selectDistinct({ name: categoriesTable.name })
    .from(categoriesTable)
    .innerJoin(mangaTable, eq(mangaTable.categoryId, categoriesTable.id))
    .where(eq(mangaTable.isHidden, false));

  const tags = await db
    .selectDistinct({ name: tagsTable.name })
    .from(tagsTable)
    .innerJoin(mangaTagsTable, eq(mangaTagsTable.tagId, tagsTable.id))
    .innerJoin(mangaTable, eq(mangaTable.id, mangaTagsTable.mangaId))
    .where(eq(mangaTable.isHidden, false));

  // Manga pages
  const mangaUrls = mangas.map((manga) => ({
    url: `${baseUrl}/${encodeURIComponent(manga.slug)}`,
    lastModified: new Date(manga.updatedAt),
  }));

  // Category pages
  const categoryUrls = categories.map((cat) => ({
    url: `${baseUrl}/category/${encodeURIComponent(cat.name)}`,
  }));

  // Tag pages
  const tagUrls = tags.map((tag) => ({
    url: `${baseUrl}/tag/${encodeURIComponent(tag.name)}`,
  }));

  return [
    {
      url: baseUrl,
    },
    {
      url: `${baseUrl}/changelog`,
    },
    ...mangaUrls,
    ...categoryUrls,
    ...tagUrls,
  ];
}

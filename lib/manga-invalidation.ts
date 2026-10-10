import { revalidatePath, revalidateTag } from "next/cache";

/** Content writes expire immediately. HTTP shared-cache variants use no-store. */
export function invalidateMangaContent(slugs: (string | null | undefined)[] = []) {
  let refreshed = true;
  const refresh = (action: () => void) => {
    try { action(); }
    catch (error) { refreshed = false; console.error("Content saved; cache refresh pending", error); }
  };
  for (const tag of ["manga-list", "authors", "tags", "categories", "public-manga"]) {
    refresh(() => revalidateTag(tag, { expire: 0 }));
  }
  // Patterns cover old/new taxonomy names and cached negative reader lookups.
  for (const path of ["/", "/tag/[tagName]", "/category/[categoryName]", "/[mangaId]", "/sitemap.xml", "/dashboard/admin", "/dashboard/admin/manga", "/dashboard/admin/metadata", "/dashboard/admin/authors", "/dashboard/submit"]) {
    refresh(() => revalidatePath(path, path.includes("[") ? "page" : undefined));
  }
  for (const slug of new Set(slugs.filter((slug): slug is string => Boolean(slug)))) refresh(() => revalidatePath(`/${slug}`));
  return refreshed;
}

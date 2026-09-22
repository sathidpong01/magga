import { and, asc, eq, ilike } from 'drizzle-orm';
import type { db as database } from '@/db';
import { authors, categories, manga, mangaTags, tags } from '@/db/schema';
import type { Catalog } from './tools';

export const publicManga = { id: manga.id, title: manga.title, slug: manga.slug, authorId: manga.authorId, categoryId: manga.categoryId };
const authorFields = { id: authors.id, name: authors.name };
const literalSearch = (query: string) => `%${query.replace(/[\\%_]/g, '\\$&')}%`;
export function createCatalog(db: typeof database): Catalog {
  const mangaDetails = async (id: string) => {
    const [item] = await db.select(publicManga).from(manga).where(and(eq(manga.id, id), eq(manga.isHidden, false))).limit(1);
    if (!item) return null;
    const assignedTags = await db.select({ id: tags.id, name: tags.name }).from(mangaTags).innerJoin(tags, eq(tags.id, mangaTags.tagId)).where(eq(mangaTags.mangaId, id)).orderBy(asc(tags.name));
    return { ...item, tags: assignedTags };
  };
  const taxonomy = async () => ({
    categories: await db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.name)).limit(1000),
    tags: await db.select({ id: tags.id, name: tags.name }).from(tags).orderBy(asc(tags.name)).limit(1000),
    limitPerCollection: 1000,
  });
  return {
    findManga: (query) => db.select(publicManga).from(manga).where(and(eq(manga.isHidden, false), ilike(manga.title, literalSearch(query)))).orderBy(asc(manga.title)).limit(50),
    mangaDetails,
    findAuthor: (query) => db.select(authorFields).from(authors).where(ilike(authors.name, literalSearch(query))).orderBy(asc(authors.name)).limit(50),
    authorDetails: async (id) => (await db.select(authorFields).from(authors).where(eq(authors.id, id)).limit(1))[0] ?? null,
    taxonomy,
    taggingContext: async (id) => { const item = await mangaDetails(id); return item ? { manga: item, catalog: await taxonomy() } : null; },
  };
}

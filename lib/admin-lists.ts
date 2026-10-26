import { db } from "@/db";
import {
  manga,
  authors,
  categories,
  tags,
  mangaTags,
  profiles,
  comments,
  mangaSubmissions,
} from "@/db/schema";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { escapeLike, pageSlice, type AdminPageQuery } from "./admin-pagination";

// Call only after the page/API's fresh authorization guard. No shared cache of private lists.
export async function readAdminManga(query: AdminPageQuery) {
  const pattern = `%${escapeLike(query.search)}%`;
  const rows = await db
    .select({
      id: manga.id,
      title: manga.title,
      slug: manga.slug,
      coverImage: manga.coverImage,
      isHidden: manga.isHidden,
      viewCount: manga.viewCount,
      categoryId: manga.categoryId,
      authorId: manga.authorId,
      category: { id: categories.id, name: categories.name },
      author: { id: authors.id, name: authors.name },
    })
    .from(manga)
    .leftJoin(categories, eq(manga.categoryId, categories.id))
    .leftJoin(authors, eq(manga.authorId, authors.id))
    .where(
      and(
        query.search
          ? or(ilike(manga.title, pattern), ilike(authors.name, pattern))
          : undefined,
        query.status === "hidden"
          ? eq(manga.isHidden, true)
          : query.status === "published"
            ? eq(manga.isHidden, false)
            : undefined,
      ),
    )
    .orderBy(
      query.sort === "title"
        ? asc(manga.title)
        : query.sort === "views"
          ? desc(manga.viewCount)
          : desc(manga.createdAt),
      desc(manga.id),
    )
    .limit(query.limit + 1)
    .offset((query.page - 1) * query.limit);
  const page = pageSlice(rows, query),
    ids = page.items.map((row) => row.id);
  const relations = ids.length
    ? await db
        .select({ mangaId: mangaTags.mangaId, id: tags.id, name: tags.name })
        .from(mangaTags)
        .innerJoin(tags, eq(tags.id, mangaTags.tagId))
        .where(inArray(mangaTags.mangaId, ids))
    : [];
  return {
    ...page,
    items: page.items.map((row) => ({
      ...row,
      tags: relations
        .filter((tag) => tag.mangaId === row.id)
        .map(({ id, name }) => ({ id, name })),
    })),
  };
}

export async function readAdminUsers(query: AdminPageQuery) {
  const pattern = `%${escapeLike(query.search)}%`;
  const rows = await db
    .select({
      id: profiles.id,
      name: profiles.name,
      email: profiles.email,
      username: profiles.username,
      image: profiles.image,
      role: profiles.role,
      banned: sql<boolean>`(coalesce(${profiles.banned},false) OR ${profiles.isBanned})`,
      banReason: profiles.banReason,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(
      and(
        query.search
          ? or(
              ilike(profiles.name, pattern),
              ilike(profiles.email, pattern),
              ilike(profiles.username, pattern),
            )
          : undefined,
        query.status === "admin"
          ? eq(profiles.role, "admin")
          : query.status === "user"
            ? eq(profiles.role, "user")
            : query.status === "banned"
              ? sql`(coalesce(${profiles.banned},false) OR ${profiles.isBanned})`
              : undefined,
      ),
    )
    .orderBy(
      query.sort === "name" ? asc(profiles.name) : desc(profiles.createdAt),
      desc(profiles.id),
    )
    .limit(query.limit + 1)
    .offset((query.page - 1) * query.limit);
  const page = pageSlice(rows, query),
    ids = page.items.map((row) => row.id);
  const [commentCounts, submissionCounts] = ids.length
    ? await Promise.all([
        db
          .select({ id: comments.userId, count: sql<number>`count(*)::int` })
          .from(comments)
          .where(inArray(comments.userId, ids))
          .groupBy(comments.userId),
        db
          .select({
            id: mangaSubmissions.userId,
            count: sql<number>`count(*)::int`,
          })
          .from(mangaSubmissions)
          .where(inArray(mangaSubmissions.userId, ids))
          .groupBy(mangaSubmissions.userId),
      ])
    : [[], []];
  const commentMap = new Map(commentCounts.map((row) => [row.id, row.count])),
    submissionMap = new Map(submissionCounts.map((row) => [row.id, row.count]));
  return {
    ...page,
    items: page.items.map((row) => ({
      ...row,
      _count: {
        comments: commentMap.get(row.id) ?? 0,
        submissions: submissionMap.get(row.id) ?? 0,
      },
    })),
  };
}

export async function readAdminOptions(
  kind: string,
  query: AdminPageQuery,
  selected: string[] = [],
) {
  const table =
    kind === "authors" ? authors : kind === "categories" ? categories : tags;
  const rows = await db
    .select({ id: table.id, name: table.name })
    .from(table)
    .where(
      query.search
        ? ilike(table.name, `%${escapeLike(query.search)}%`)
        : undefined,
    )
    .orderBy(asc(table.name), asc(table.id))
    .limit(query.limit + 1)
    .offset((query.page - 1) * query.limit);
  const page = pageSlice(rows, query);
  const missing = selected.filter(
    (id) => !page.items.some((row) => row.id === id),
  );
  const extra = missing.length
    ? await db
        .select({ id: table.id, name: table.name })
        .from(table)
        .where(inArray(table.id, missing.slice(0, 50)))
    : [];
  return { ...page, items: [...page.items, ...extra] };
}

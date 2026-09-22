import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { db as database } from '@/db';
import { authors, manga, mangaTags, tags, profiles, categories } from '@/db/schema';
import { mcpMetadataDrafts as drafts, mcpApiKeys as keys } from '@/db/mcp-schema';

export const draftStatuses = ['pending', 'applied', 'rejected', 'approved'] as const;
export function draftFilters(params: Record<string, string | string[] | undefined>) {
  const status = typeof params.status === 'string' && draftStatuses.includes(params.status as typeof draftStatuses[number]) ? params.status : 'all';
  const page = typeof params.page === 'string' && /^\d{1,4}$/.test(params.page) ? Math.max(1, Math.min(1000, Number(params.page))) : 1;
  const id = z.string().uuid().safeParse(params.draft);
  return { status, page, id: id.success ? id.data : undefined };
}

// Browser administrators read explicit columns, without a bearer key or review token.
// Never reuse the MCP review service here: it locks rows for subsequent decisions.
export async function readAdminDrafts(db: typeof database, userId: string, filter: ReturnType<typeof draftFilters>) {
  return db.transaction(async tx => {
    const [admin] = await tx.select({ id: profiles.id }).from(profiles).where(and(eq(profiles.id, userId), eq(profiles.role, 'admin'), eq(profiles.isBanned, false), sql`coalesce(${profiles.banned}, false) = false`)).limit(1);
    if (!admin) throw new Error('Admin access required');
    const columns = { id: drafts.id, kind: drafts.kind, targetId: drafts.targetId, targetType: drafts.targetType, status: drafts.status, createdAt: drafts.createdAt, updatedAt: drafts.updatedAt, client: keys.name, proposer: profiles.username,
      targetName: sql<string | null>`CASE WHEN ${drafts.targetType} = 'author' THEN (SELECT ${authors.name} FROM ${authors} WHERE ${authors.id} = ${drafts.targetId}) ELSE (SELECT ${manga.title} FROM ${manga} WHERE ${manga.id} = ${drafts.targetId}) END` };
    const rows = await tx.select(columns).from(drafts).innerJoin(keys, eq(keys.id, drafts.requestingKeyId)).innerJoin(profiles, eq(profiles.id, keys.ownerUserId))
      .where(filter.status === 'all' ? undefined : eq(drafts.status, filter.status)).orderBy(desc(drafts.createdAt), desc(drafts.id)).limit(21).offset((filter.page - 1) * 20);
    const selectedId = filter.id ?? rows[0]?.id;
    const [selected] = selectedId ? await tx.select({ ...columns, payload: drafts.payload, decisionPayload: drafts.decisionPayload, sources: drafts.sources, reviewerId: drafts.reviewerUserId, reviewNote: drafts.reviewNote }).from(drafts).innerJoin(keys, eq(keys.id, drafts.requestingKeyId)).innerJoin(profiles, eq(profiles.id, keys.ownerUserId)).where(eq(drafts.id, selectedId)).limit(1) : [];
    let current: Record<string, unknown> | null = null;
    let targetName: string | null = null;
    let reviewer: string | null = null;
    if (selected?.targetType === 'author') {
      const [author] = await tx.select({ name: authors.name, profile_url: authors.profileUrl, social_links: authors.socialLinks }).from(authors).where(eq(authors.id, selected.targetId)).limit(1);
      if (author) {
        targetName = author.name;
        let links: unknown = author.social_links;
        try { links = JSON.parse(author.social_links || '[]'); } catch { /* Show legacy text without making it a link. */ }
        current = { profile_url: author.profile_url, social_links: Array.isArray(links) ? links.map(v => typeof v === 'object' && v ? v.url : v) : links, social_link_details: links };
      }
    } else if (selected?.targetType === 'manga') {
      const [entry] = await tx.select({ title: manga.title, author_id: manga.authorId, category_id: manga.categoryId }).from(manga).where(eq(manga.id, selected.targetId)).limit(1);
      if (entry) {
        targetName = entry.title;
        const assigned = await tx.select({ name: tags.name }).from(mangaTags).innerJoin(tags, eq(tags.id, mangaTags.tagId)).where(eq(mangaTags.mangaId, selected.targetId));
        let tagCatalog: { name: string }[] = [];
        if (selected.kind === 'manga_tags') {
          const parsed = z.object({ tag_names: z.array(z.string()) }).safeParse(selected.payload);
          if (parsed.success) {
            const requested = new Set(parsed.data.tag_names.map(name => name.trim().toLowerCase()));
            tagCatalog = (await tx.select({ name: tags.name }).from(tags)).filter(tag => requested.has(tag.name.trim().toLowerCase()));
          }
        }
        const categoryProposal = selected.kind === 'manga_metadata' ? z.object({ category_name: z.string().optional() }).passthrough().safeParse(selected.payload) : null;
        const category = entry.category_id ? (await tx.select({ id: categories.id, name: categories.name }).from(categories).where(eq(categories.id, entry.category_id)).limit(1))[0] ?? null : null;
        const proposedCategory = categoryProposal?.success && categoryProposal.data.category_name
          ? (await tx.select({ id: categories.id, name: categories.name }).from(categories)).find(item => item.name.trim().toLowerCase() === categoryProposal.data.category_name?.trim().toLowerCase()) ?? null
          : null;
        current = { ...entry, tag_names: assigned.map(t => t.name), tag_catalog: tagCatalog, category, category_catalog: proposedCategory };
      }
    }
    if (selected?.reviewerId) {
      const [person] = await tx.select({ name: profiles.username }).from(profiles).where(eq(profiles.id, selected.reviewerId)).limit(1);
      reviewer = person?.name ?? 'ผู้ดูแล';
    }
    // Names make proposed references inspectable without interpreting opaque IDs.
    const referenceNames: Record<string, string> = {};
    if (selected?.kind === 'manga_metadata') {
      for (const [table, field] of [[authors, 'author_id'], [categories, 'category_id']] as const) {
        const values = [current?.[field], (selected.payload as Record<string, unknown> | null)?.[field]];
        for (const value of values) if (typeof value === 'string' && z.string().uuid().safeParse(value).success) {
          const [ref] = await tx.select({ name: table.name }).from(table).where(eq(table.id, value)).limit(1);
          if (ref) referenceNames[value] = ref.name;
        }
      }
    }
    return { rows: rows.slice(0, 20), hasNext: rows.length > 20, selected: selected ?? null, current, targetName, reviewer, referenceNames };
  }, { accessMode: 'read only', isolationLevel: 'repeatable read' });
}

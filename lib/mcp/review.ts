import { createHash, randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { db as database } from '@/db';
import { authors, categories, manga, mangaTags, profiles, tags } from '@/db/schema';
import { mcpApiKeys, mcpAuditEvents, mcpMetadataDrafts } from '@/db/mcp-schema';
import { requireScope, type Principal } from './auth';
import { draftInput, metadataSourcesRequired, normalizeTagNames, publicReference, validateSocialLink } from './drafts';
import { mergeSocialLinks } from '@/lib/social-link-details';
import { approvalSelection, draftKind, selectDraftProposal, type ApprovalSelection } from './approval-selection';

type Tx = Parameters<Parameters<typeof database.transaction>[0]>[0];
type Draft = typeof mcpMetadataDrafts.$inferSelect;
export interface ReviewService {
  list(key: Principal): Promise<unknown>;
  get(id: string, key: Principal): Promise<unknown>;
  decide(id: string, token: string, action: 'apply' | 'reject', key: Principal, requestId: string, selection?: ApprovalSelection): Promise<unknown>;
}
export async function currentKey(tx: Tx, key: Principal, write = false) {
  requireScope(key, 'catalog:read'); if (write) requireScope(key, 'metadata:write');
  const [row] = await tx.select({ scopes: mcpApiKeys.scopes }).from(mcpApiKeys).innerJoin(profiles, eq(profiles.id, mcpApiKeys.ownerUserId)).where(and(eq(mcpApiKeys.id, key.id), eq(profiles.id, key.ownerUserId), eq(profiles.role, 'admin'), eq(profiles.isBanned, false), sql`coalesce(${profiles.banned}, false) = false`, sql`${mcpApiKeys.revokedAt} IS NULL AND ${mcpApiKeys.expiresAt} > now()`)).for('share');
  if (!row?.scopes.includes('catalog:read') || (write && !row.scopes.includes('metadata:write'))) throw new Error('Access denied');
}
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(',')}}`;
  return JSON.stringify(value);
}
const digest = (draft: Draft, current: unknown) => createHash('sha256').update(stable({ id: draft.id, kind: draft.kind, targetType: draft.targetType, targetId: draft.targetId, payload: draft.payload, sources: draft.sources, current })).digest('hex');
type BrowserActor = { adminUserId: string };
type ReviewActor = Principal | BrowserActor;
async function currentActor(tx: Tx, actor: ReviewActor, write = false) {
  if (!('adminUserId' in actor)) return currentKey(tx, actor, write);
  const [admin] = await tx.select({ id: profiles.id }).from(profiles).where(and(eq(profiles.id, actor.adminUserId), eq(profiles.role, 'admin'), eq(profiles.isBanned, false), sql`coalesce(${profiles.banned}, false) = false`)).for('share');
  if (!admin) throw new Error('Access denied');
}
async function ownedDraft(tx: Tx, id: string, key: ReviewActor) {
  z.string().uuid().parse(id);
  const [draft] = await tx.select({ draft: mcpMetadataDrafts }).from(mcpMetadataDrafts).innerJoin(mcpApiKeys, eq(mcpApiKeys.id, mcpMetadataDrafts.requestingKeyId)).where(and(eq(mcpMetadataDrafts.id, id), ('adminUserId' in key ? undefined : eq(mcpApiKeys.ownerUserId, key.ownerUserId)))).for('update', { of: mcpMetadataDrafts });
  if (!draft) throw new Error('Draft unavailable');
  return draft.draft;
}
async function currentTarget(tx: Tx, draft: Draft) {
  if (draft.targetType === 'manga') {
    const [row] = await tx.select({ id: manga.id, title: manga.title, slug: manga.slug, author_id: manga.authorId, category_id: manga.categoryId }).from(manga).where(and(eq(manga.id, draft.targetId), eq(manga.isHidden, false))).for('update');
    if (!row) throw new Error('Target unavailable');
    const assigned = await tx.select({ id: tags.id, name: tags.name }).from(mangaTags).innerJoin(tags, eq(tags.id, mangaTags.tagId)).where(eq(mangaTags.mangaId, row.id)).orderBy(asc(tags.id));
    if (draft.kind === 'manga_metadata') {
      const payload = z.object({ category_name: z.string().optional() }).passthrough().parse(draft.payload);
      if (payload.category_name) {
        const catalog = await tx.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.id));
        const currentCategory = row.category_id ? catalog.find(entry => entry.id === row.category_id) ?? null : null;
        const match = catalog.find(entry => entry.name.trim().toLowerCase() === payload.category_name?.trim().toLowerCase()) ?? null;
        return { ...row, tags: assigned, category: currentCategory, category_catalog: match };
      }
    }
    if (draft.kind !== 'manga_tags') return { ...row, tags: assigned };
    const payload = z.object({ tag_names: z.array(z.string()) }).parse(draft.payload);
    const requested = normalizeTagNames(payload.tag_names);
    const catalog = await tx.select({ id: tags.id, name: tags.name }).from(tags).orderBy(asc(tags.id));
    const matches = catalog.filter(tag => requested.some(name => name.toLowerCase() === tag.name.trim().toLowerCase()));
    return { ...row, tags: assigned, tag_catalog: matches };
  }
  const [row] = await tx.select({ id: authors.id, profile_url: authors.profileUrl, social_links: authors.socialLinks }).from(authors).where(eq(authors.id, draft.targetId)).for('update');
  if (!row) throw new Error('Target unavailable');
  // Existing public URL validation also prevents exposing arbitrary legacy text.
  if (row.profile_url) publicReference(row.profile_url);
  const links = z.array(z.object({ url: z.string(), label: z.string(), icon: z.string() }).passthrough()).max(100).parse(row.social_links ? JSON.parse(row.social_links) : []);
  for (const link of links) publicReference(link.url);
  return { id: row.id, profile_url: row.profile_url, social_links: links.map((link) => link.url), rawLinks: links };
}
function reviewService(db: typeof database, invalidate: () => Promise<void>, allowedHosts?: readonly string[]) {
  return {
    list: (key: Principal) => db.transaction(async (tx) => {
      await currentKey(tx, key);
      return tx.select({ draft_id: mcpMetadataDrafts.id, kind: mcpMetadataDrafts.kind, target_type: mcpMetadataDrafts.targetType, target_id: mcpMetadataDrafts.targetId, status: mcpMetadataDrafts.status, created_at: mcpMetadataDrafts.createdAt }).from(mcpMetadataDrafts).innerJoin(mcpApiKeys, eq(mcpApiKeys.id, mcpMetadataDrafts.requestingKeyId)).where(and(eq(mcpApiKeys.ownerUserId, key.ownerUserId), eq(mcpMetadataDrafts.status, 'pending'), sql`((${mcpMetadataDrafts.targetType} = 'manga' AND EXISTS (SELECT 1 FROM ${manga} WHERE ${manga.id} = ${mcpMetadataDrafts.targetId} AND ${manga.isHidden} = false)) OR (${mcpMetadataDrafts.targetType} = 'author' AND EXISTS (SELECT 1 FROM ${authors} WHERE ${authors.id} = ${mcpMetadataDrafts.targetId})))`)).orderBy(desc(mcpMetadataDrafts.createdAt), asc(mcpMetadataDrafts.id)).limit(50);
    }),
    get: (id: string, key: ReviewActor) => db.transaction(async (tx) => {
      await currentActor(tx, key);
      const draft = await ownedDraft(tx, id, key);
      const current = await currentTarget(tx, draft);
      const safeCurrent = 'rawLinks' in current ? { id: current.id, profile_url: current.profile_url, social_links: current.social_links, social_link_details: current.rawLinks?.map(({ url, label, icon }) => ({ url, label, icon })) } : current;
      return { draft_id: draft.id, kind: draft.kind, proposal: draft.payload, applied_proposal: draft.decisionPayload, sources: draft.sources, status: draft.status, current: safeCurrent, review_token: digest(draft, current), effect: draft.kind === 'manga_author' ? 'create new author with selected social channels and assign to this unassigned manga; no primary link' : draft.kind === 'manga_tags' ? 'add selected tags; preserve existing tags' : draft.kind === 'author_links' ? 'apply selected primary/social links; preserve other social URLs' : 'update only selected proposed fields' };
    }),
    async decide(id: string, token: string, action: 'apply' | 'reject', key: ReviewActor, requestId: string, rawSelection?: ApprovalSelection) {
      z.string().regex(/^[a-f0-9]{64}$/).parse(token);
      const selection = rawSelection === undefined ? undefined : approvalSelection.parse(rawSelection);
      if (action === 'reject' && selection !== undefined) throw new Error('Rejection does not accept an approval selection');
      const result = await db.transaction(async (tx) => {
        await currentActor(tx, key, true);
        const draft = await ownedDraft(tx, id, key);
        const finalStatus = action === 'apply' ? 'applied' : 'rejected';
        const kind = draftKind.parse(draft.kind);
        const selectedPayload = action === 'apply' ? selectDraftProposal(kind, draft.payload, selection) : null;
        if (draft.status === finalStatus) {
          if (action === 'apply' && draft.decisionPayload !== null && !isDeepStrictEqual(draft.decisionPayload, selectedPayload)) throw new Error('Decision conflict');
          if (action === 'apply' && draft.decisionPayload === null && selection !== undefined) throw new Error('Decision conflict');
          return { draft_id: id, status: finalStatus, already_completed: true, ...(action === 'apply' ? { applied_proposal: draft.decisionPayload ?? draft.payload } : {}) };
        }
        if (draft.status !== 'pending') throw new Error('Draft is no longer pending');
        if (action === 'apply' && draft.kind === 'manga_tags') {
          await tx.execute(sql`SET LOCAL lock_timeout = '5s'`);
          await tx.execute(sql`LOCK TABLE ${tags} IN SHARE ROW EXCLUSIVE MODE`);
        }
        const proposesCategoryName = kind === 'manga_metadata' && z.object({ category_name: z.string() }).passthrough().safeParse(selectedPayload).success;
        if (action === 'apply' && proposesCategoryName) {
          await tx.execute(sql`SET LOCAL lock_timeout = '5s'`);
          await tx.execute(sql`LOCK TABLE ${categories} IN SHARE ROW EXCLUSIVE MODE`);
        }
        const current = await currentTarget(tx, draft);
        if (token !== digest(draft, current)) throw new Error('Stale review');
        if (action === 'apply') {
          // Re-parse stored payloads and references: database content is not trusted input.
          const sources = z.array(z.object({ url: z.string(), confidence: z.number() })).parse(draft.sources);
          for (const source of sources) publicReference(source.url, allowedHosts);
          const originalInput = draftInput.parse({ request_id: draft.id, kind, target: { type: draft.targetType, id: draft.targetId }, proposal: draft.payload, sources });
          if (metadataSourcesRequired(originalInput) && !sources.length) throw new Error('Sources required');
          // The selected proposal is a validated subset of the fully parsed draft.
          // A new author may intentionally be approved without any proposed social channels.
          const input = { ...originalInput, proposal: selectedPayload } as typeof originalInput;
          if (input.kind === 'manga_tags') {
            const names = normalizeTagNames(input.proposal.tag_names);
            const catalog = await tx.select({ id: tags.id, name: tags.name }).from(tags);
            const found = catalog.filter(tag => names.some(name => name.toLowerCase() === tag.name.trim().toLowerCase()));
            const missing = names.filter(name => !found.some(tag => tag.name.trim().toLowerCase() === name.toLowerCase()));
            const created = missing.map(name => ({ id: randomUUID(), name }));
            if (created.length) await tx.insert(tags).values(created);
            await tx.insert(mangaTags).values([...found, ...created].map(tag => ({ mangaId: draft.targetId, tagId: tag.id }))).onConflictDoNothing();
          } else if (input.kind === 'manga_author') {
            if (!('author_id' in current) || current.author_id) throw new Error('Manga already has an author');
            for (const link of input.proposal.social_links) validateSocialLink(link, allowedHosts);
            const links = mergeSocialLinks([], input.proposal.social_links);
            // Serialize the absence check against every author writer, including the
            // existing admin API. A short lock is needed without changing name uniqueness globally.
            await tx.execute(sql`SET LOCAL lock_timeout = '5s'`);
            await tx.execute(sql`LOCK TABLE ${authors} IN SHARE ROW EXCLUSIVE MODE`);
            const existing = await tx.select({ id: authors.id }).from(authors).where(sql`lower(btrim(${authors.name})) = lower(btrim(${input.proposal.name}))`).limit(1);
            if (existing.length) throw new Error('Author already exists; propose the existing author instead');
            const authorId = randomUUID();
            await tx.insert(authors).values({ id: authorId, name: input.proposal.name, profileUrl: null, socialLinks: JSON.stringify(links) });
            await tx.update(manga).set({ authorId, updatedAt: new Date().toISOString() }).where(eq(manga.id, draft.targetId));
          } else if (input.kind === 'manga_metadata') {
            const p = input.proposal;
            if (p.author_id && !(await tx.select({ id: authors.id }).from(authors).where(eq(authors.id, p.author_id)).for('share')).length) throw new Error('Unknown author');
            if (p.category_id && !(await tx.select({ id: categories.id }).from(categories).where(eq(categories.id, p.category_id)).for('share')).length) throw new Error('Unknown category');
            let categoryId = p.category_id;
            if (p.category_name) {
              const catalog = await tx.select({ id: categories.id, name: categories.name }).from(categories);
              const existing = catalog.find(entry => entry.name.trim().toLowerCase() === p.category_name?.toLowerCase());
              categoryId = existing?.id ?? randomUUID();
              if (!existing) await tx.insert(categories).values({ id: categoryId, name: p.category_name });
            }
            await tx.update(manga).set({ ...(p.title !== undefined ? { title: p.title } : {}), ...(p.author_id ? { authorId: p.author_id } : {}), ...(categoryId ? { categoryId } : {}), updatedAt: new Date().toISOString() }).where(eq(manga.id, draft.targetId));
          } else {
            if (!('rawLinks' in current) || !current.rawLinks) throw new Error('Target mismatch');
            for (const link of input.proposal.social_links ?? []) validateSocialLink(link, allowedHosts);
            const merged = mergeSocialLinks(current.rawLinks, input.proposal.social_links ?? []);
            if (merged.length > 100) throw new Error('Too many links');
            await tx.update(authors).set({ ...(input.proposal.profile_url ? { profileUrl: publicReference(input.proposal.profile_url, allowedHosts) } : {}), socialLinks: JSON.stringify(merged), updatedAt: new Date().toISOString() }).where(eq(authors.id, draft.targetId));
          }
        }
        await tx.update(mcpMetadataDrafts).set({ status: finalStatus, decisionPayload: selectedPayload, reviewerUserId: 'adminUserId' in key ? key.adminUserId : key.ownerUserId, updatedAt: new Date() }).where(eq(mcpMetadataDrafts.id, id));
        await tx.insert(mcpAuditEvents).values({ requestId, keyId: 'adminUserId' in key ? draft.requestingKeyId : key.id, ownerUserId: 'adminUserId' in key ? key.adminUserId : key.ownerUserId, toolName: `${'adminUserId' in key ? 'admin_' : ''}${action}_metadata_draft`, outcome: 'success' });
        return { draft_id: id, status: finalStatus, already_completed: false, ...(action === 'apply' ? { applied_proposal: selectedPayload } : {}) };
      });
      // Commit is durable first. Retrying an applied draft retries invalidation too.
      let cache_refresh_pending = false;
      if (action === 'apply') { try { await invalidate(); } catch { cache_refresh_pending = true; } }
      return { ...result, cache_refresh_pending };
    },
  };
}

export function createReviewService(db: typeof database, invalidate: () => Promise<void> = async () => {}, allowedHosts?: readonly string[]): ReviewService {
  return reviewService(db, invalidate, allowedHosts);
}
// The caller supplies the authenticated session identity, never a client-provided user ID.
export function createBrowserReviewService(db: typeof database, userId: string, invalidate: () => Promise<void> = async () => {}, allowedHosts?: readonly string[]) {
  const service = reviewService(db, invalidate, allowedHosts);
  const actor: BrowserActor = { adminUserId: userId };
  return {
    get: (id: string) => service.get(id, actor),
    decide: (id: string, token: string, action: 'apply' | 'reject', requestId: string, selection?: ApprovalSelection) => service.decide(id, token, action, actor, requestId, selection),
  };
}

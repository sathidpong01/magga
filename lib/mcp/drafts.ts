import { isDeepStrictEqual } from 'node:util';
import { isIP } from 'node:net';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { db as database } from '@/db';
import { authors, categories, manga, tags, profiles } from '@/db/schema';
import { mcpApiKeys, mcpAuditEvents, mcpMetadataDrafts } from '@/db/mcp-schema';
import { requireScope, type Principal } from './auth';
import { socialLinkDetails, type SocialLinkProposal } from '@/lib/social-link-details';

const uuid = z.string().uuid();
export const tagNames = z.array(z.string().trim().min(1).max(100)).min(1).max(50);
export const categoryName = z.string().trim().min(1).max(100).regex(/^[^<>\u0000-\u001f\u007f]+$/);
const url = z.string().max(2048).url();
const socialLink = z.union([url, z.object({ url, label: z.string().trim().min(1).max(200), icon: url }).strict()]);
const base = { request_id: uuid, sources: z.array(z.object({ url, confidence: z.number().min(0).max(1) }).strict()).max(10) };
export const draftInput = z.discriminatedUnion('kind', [
  z.object({ ...base, kind: z.literal('manga_author'), target: z.object({ type: z.literal('manga'), id: uuid }).strict(), proposal: z.object({ name: z.string().trim().min(1).max(100).regex(/^[^<>\u0000-\u001f\u007f]+$/), social_links: z.array(socialLink).min(1).max(10) }).strict() }).strict(),
  z.object({ ...base, kind: z.literal('manga_tags'), target: z.object({ type: z.literal('manga'), id: uuid }).strict(), proposal: z.object({ tag_names: tagNames }).strict() }).strict(),
  z.object({ ...base, kind: z.literal('manga_metadata'), target: z.object({ type: z.literal('manga'), id: uuid }).strict(), proposal: z.object({ title: z.string().trim().min(1).max(200).optional(), category_id: uuid.optional(), category_name: categoryName.optional(), author_id: uuid.optional() }).strict().refine((v) => Object.keys(v).length > 0).refine((v) => !(v.category_id && v.category_name), { message: 'Use category_id or category_name, not both' }) }).strict(),
  z.object({ ...base, kind: z.literal('author_links'), target: z.object({ type: z.literal('author'), id: uuid }).strict(), proposal: z.object({ profile_url: url.optional(), social_links: z.array(socialLink).max(10).optional() }).strict().refine((v) => !!v.profile_url || !!v.social_links?.length) }).strict(),
]);
export type DraftInput = z.infer<typeof draftInput>;
export function normalizeTagNames(names: string[]) {
  const parsed = tagNames.parse(names);
  const unique = new Map<string, string>();
  for (const name of parsed) if (!unique.has(name.toLowerCase())) unique.set(name.toLowerCase(), name);
  return [...unique.values()].sort((a, b) => a.localeCompare(b));
}
export function metadataSourcesRequired(input: DraftInput) {
  if (input.kind === 'manga_tags') return false;
  if (input.kind !== 'manga_metadata') return true;
  const keys = Object.keys(input.proposal);
  return !(keys.length === 1 && (keys[0] === 'category_id' || keys[0] === 'category_name'));
}
export interface DraftService {
  validateTags(id: string, names: string[]): Promise<unknown>;
  validateCategory(id: string, name: string): Promise<unknown>;
  create(input: DraftInput, key: Principal, requestId: string): Promise<unknown>;
}
// Validation of stored references only. This function performs no network access
// and must never be used as a fetch/SSRF authorization check.
export function publicReference(value: string, allowedHosts?: readonly string[]) {
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port || parsed.search || parsed.hash || isIP(parsed.hostname) || parsed.hostname.includes(':') || !parsed.hostname.includes('.') || parsed.hostname.endsWith('.') || /(?:^|\.)(localhost|local|internal|invalid|test|localdomain|home\.arpa)$/.test(parsed.hostname) || (allowedHosts && !allowedHosts.includes(parsed.hostname))) throw new Error('Reference unavailable');
  return parsed.href;
}
export function validateSocialLink(value: SocialLinkProposal, allowedHosts?: readonly string[]) {
  const link = socialLinkDetails(value);
  publicReference(link.url, allowedHosts);
  // Favicons commonly use query parameters. Permit these for image references only;
  // keep HTTPS/public-host validation and never fetch images on the server.
  const icon = new URL(link.icon); icon.search = '';
  publicReference(icon.href);
  return link;
}
export function createDraftService(db: typeof database, allowedHosts?: readonly string[]): DraftService {
  async function validateTags(id: string, names: string[]) {
    uuid.parse(id); const requested = normalizeTagNames(names);
    const [target] = await db.select({ id: manga.id }).from(manga).where(and(eq(manga.id, id), eq(manga.isHidden, false))).limit(1);
    if (!target) throw new Error('Target unavailable');
    const catalog = await db.select({ id: tags.id, name: tags.name }).from(tags);
    const found = catalog.filter(tag => requested.some(name => name.toLowerCase() === tag.name.trim().toLowerCase()));
    const created = requested.filter(name => !found.some(tag => tag.name.trim().toLowerCase() === name.toLowerCase()));
    return { valid: true, tags: found, unknown_tags: created, existing_tags: found, new_tags: created };
  }
  async function validateCategory(id: string, rawName: string) {
    uuid.parse(id); const name = categoryName.parse(rawName);
    const [target] = await db.select({ id: manga.id, categoryId: manga.categoryId }).from(manga).where(and(eq(manga.id, id), eq(manga.isHidden, false))).limit(1);
    if (!target) throw new Error('Target unavailable');
    const catalog = await db.select({ id: categories.id, name: categories.name }).from(categories);
    const existing = catalog.find(entry => entry.name.trim().toLowerCase() === name.toLowerCase()) ?? null;
    const current = target.categoryId ? catalog.find(entry => entry.id === target.categoryId) ?? null : null;
    return { valid: true, current_category: current, existing_category: existing, new_category: existing ? null : name };
  }
  return {
    validateTags,
    validateCategory,
    async create(raw, key, requestId) {
      requireScope(key, 'catalog:read'); requireScope(key, 'draft:write');
      const input = draftInput.parse(raw);
      const sources = input.sources.map((source) => ({ url: publicReference(source.url, allowedHosts), confidence: source.confidence, verification: 'unverified' as const, confidenceOrigin: 'client' as const }));
      if (metadataSourcesRequired(input) && !sources.length) throw new Error('Sources required');
      const proposal = input.kind === 'manga_tags' ? { tag_names: normalizeTagNames(input.proposal.tag_names) } : input.proposal;
      if (input.kind === 'manga_author') {
        for (const link of input.proposal.social_links) validateSocialLink(link, allowedHosts);
      }
      if (input.kind === 'author_links') {
        if (input.proposal.profile_url) publicReference(input.proposal.profile_url, allowedHosts);
        for (const link of input.proposal.social_links ?? []) validateSocialLink(link, allowedHosts);
      }
      return db.transaction(async (tx) => {
        const [current] = await tx.select({ scopes: mcpApiKeys.scopes }).from(mcpApiKeys).innerJoin(profiles, eq(profiles.id, mcpApiKeys.ownerUserId)).where(and(eq(mcpApiKeys.id, key.id), eq(profiles.id, key.ownerUserId), eq(profiles.role, 'admin'), eq(profiles.isBanned, false), sql`coalesce(${profiles.banned}, false) = false`, sql`${mcpApiKeys.revokedAt} IS NULL AND ${mcpApiKeys.expiresAt} > now()`)).for('share');
        if (!current?.scopes.includes('catalog:read') || !current.scopes.includes('draft:write')) throw new Error('Access denied');
        // Lock the target against hiding/deletion until the pending draft commits.
        const target = input.target.type === 'manga'
          ? await tx.select({ id: manga.id }).from(manga).where(and(eq(manga.id, input.target.id), eq(manga.isHidden, false))).for('share')
          : await tx.select({ id: authors.id }).from(authors).where(eq(authors.id, input.target.id)).for('share');
        if (!target.length) throw new Error('Target unavailable');
        if (input.kind === 'manga_author') {
          const [entry] = await tx.select({ authorId: manga.authorId }).from(manga).where(eq(manga.id, input.target.id));
          if (entry.authorId) throw new Error('Manga already has an author');
          const existing = await tx.select({ id: authors.id }).from(authors).where(sql`lower(btrim(${authors.name})) = lower(btrim(${input.proposal.name}))`).limit(1);
          if (existing.length) throw new Error('Author already exists; propose the existing author instead');
        }
        if (input.kind === 'manga_metadata') {
          if (input.proposal.author_id && !(await tx.select({ id: authors.id }).from(authors).where(eq(authors.id, input.proposal.author_id)).for('share')).length) throw new Error('Unknown author');
          if (input.proposal.category_id && !(await tx.select({ id: categories.id }).from(categories).where(eq(categories.id, input.proposal.category_id)).for('share')).length) throw new Error('Unknown category');
        }
        const row = { id: input.request_id, requestingKeyId: key.id, kind: input.kind, targetType: input.target.type, targetId: input.target.id, payload: proposal, sources, status: 'pending' };
        await tx.insert(mcpMetadataDrafts).values(row).onConflictDoNothing({ target: mcpMetadataDrafts.id });
        const [saved] = await tx.select().from(mcpMetadataDrafts).where(eq(mcpMetadataDrafts.id, input.request_id));
        if (!saved || saved.status !== 'pending' || saved.requestingKeyId !== key.id || saved.kind !== row.kind || saved.targetId !== row.targetId || saved.targetType !== row.targetType || !isDeepStrictEqual(saved.payload, proposal) || !isDeepStrictEqual(saved.sources, sources)) throw new Error('Request conflict');
        // A committed draft always has a success audit, even if HTTP delivery fails.
        await tx.insert(mcpAuditEvents).values({ requestId, keyId: key.id, ownerUserId: key.ownerUserId, toolName: 'create_metadata_draft', outcome: 'success' });
        return { draft_id: saved.id, status: saved.status, applied: false };
      });
    },
  };
}

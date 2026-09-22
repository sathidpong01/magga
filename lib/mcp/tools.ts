import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { requireScope, type Principal } from './auth';
import { version } from '@/package.json';
import { categoryName, draftInput, tagNames, type DraftService } from './drafts';
import type { ReviewService } from './review';
import { approvalSelection } from './approval-selection';

export interface Catalog {
  findManga(query: string): Promise<unknown>;
  mangaDetails(id: string): Promise<unknown>;
  findAuthor(query: string): Promise<unknown>;
  authorDetails(id: string): Promise<unknown>;
  taxonomy(): Promise<unknown>;
  taggingContext(id: string): Promise<unknown>;
}
// Deliberately no raw arguments, query text, exception messages or result data.
export type AuditEvent = { requestId: string; keyId: string; ownerUserId: string; toolName: string; outcome: 'started' | 'success' | 'failed' };
export type Audit = (event: AuditEvent) => Promise<void>;
export const toolNames = ['find_manga', 'get_manga_details', 'find_author', 'get_author_details', 'list_categories_and_tags', 'get_tagging_context', 'validate_tag_proposal', 'validate_category_proposal', 'create_metadata_draft', 'list_metadata_drafts', 'get_metadata_draft', 'apply_metadata_draft', 'reject_metadata_draft'];
export function createServer(key: Principal, catalog: Catalog, drafts?: DraftService, requestId = '', review?: ReviewService) {
  const server = new McpServer({ name: 'magga-metadata', version });
  const query = z.string().trim().min(1).max(200);
  const id = z.string().uuid();
  function register(name: string, inputSchema: z.ZodRawShape, run: (args: Record<string, unknown>) => Promise<unknown>) {
    server.registerTool(name, { inputSchema, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (args) => {
      try {
        requireScope(key, 'catalog:read');
        const data = await run(args);
        return { content: [{ type: 'text' as const, text: JSON.stringify({ data }) }], structuredContent: { data } };
      } catch {
        return { isError: true, content: [{ type: 'text' as const, text: 'Tool request failed' }] };
      }
    });
  }
  if (key.scopes.includes('catalog:read')) {
    register('find_manga', { query }, (args) => catalog.findManga(query.parse(args.query)));
    register('get_manga_details', { manga_id: id }, (args) => catalog.mangaDetails(id.parse(args.manga_id)));
    register('find_author', { query }, (args) => catalog.findAuthor(query.parse(args.query)));
    register('get_author_details', { author_id: id }, (args) => catalog.authorDetails(id.parse(args.author_id)));
    register('list_categories_and_tags', {}, () => catalog.taxonomy());
    register('get_tagging_context', { manga_id: id }, (args) => catalog.taggingContext(id.parse(args.manga_id)));
  }
  if (drafts && key.scopes.includes('catalog:read')) {
    register('validate_tag_proposal', { manga_id: id, tag_names: tagNames }, (args) => drafts.validateTags(id.parse(args.manga_id), tagNames.parse(args.tag_names)));
    register('validate_category_proposal', { manga_id: id, category_name: categoryName }, (args) => drafts.validateCategory(id.parse(args.manga_id), categoryName.parse(args.category_name)));
    if (key.scopes.includes('draft:write')) {
      server.registerTool('create_metadata_draft', {
        description: 'Create a pending proposal only; never apply metadata. Research is performed by the client, not this server. Reuse request_id for identical retries. manga_tags proposal: {tag_names:string[]} preserves assigned tags, assigns catalog tags, and creates then assigns missing tag names only after approval. A category-only manga_metadata proposal may use {category_id} for an existing category or {category_name} to reuse/create by name and replace the manga category after approval; category-only proposals need no source. Other manga_metadata fields are {title?,author_id?} and require sources. manga_author: {name:string,social_links:(string|{url,label,icon})[]} targets an unassigned manga and proposes creating a NEW author and linking that manga in one approval; reject existing names and never use this to replace an assigned author. author_links: {profile_url?,social_links?:(string|{url,label,icon})[]}. Prefer objects with the researched account display name and public HTTPS favicon URL (icon URLs may contain query parameters). An object for an existing exact URL updates only its label/icon; other channels are preserved. URL-only entries use a handle/favicon fallback, not a verified display name. For adding author channels use social_links only and preserve profile_url. Include profile_url only when the user explicitly requests changing the primary link. Read existing author links first; do not propose existing channels or alternate URL forms of the same account without verification. Target type must match kind. Source URLs must use public HTTPS hostnames without query/fragment; confidence is client supplied and verification remains unverified.',
        inputSchema: { request_id: id, kind: z.enum(['author_links', 'manga_tags', 'manga_metadata', 'manga_author']), target: z.object({ type: z.enum(['author', 'manga']), id }).strict(), proposal: z.record(z.string(), z.unknown()), sources: z.array(z.object({ url: z.string().url().max(2048), confidence: z.number().min(0).max(1) }).strict()).max(10) },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      }, async (args) => {
        try {
          requireScope(key, 'catalog:read'); requireScope(key, 'draft:write');
          const data = await drafts.create(draftInput.parse(args), key, requestId);
          return { content: [{ type: 'text' as const, text: JSON.stringify({ data }) }], structuredContent: { data } };
        } catch { return { isError: true, content: [{ type: 'text' as const, text: 'Draft request failed' }] }; }
      });
    }
  }
  if (review && key.scopes.includes('catalog:read')) {
    register('list_metadata_drafts', {}, () => review.list(key));
    register('get_metadata_draft', { draft_id: id }, (args) => review.get(id.parse(args.draft_id), key));
    if (key.scopes.includes('metadata:write')) {
      for (const action of ['apply', 'reject'] as const) {
        server.registerTool(`${action}_metadata_draft`, {
          description: `${action === 'apply' ? 'Apply all or a selected subset of the reviewed pending draft to live metadata. Omit selection to apply everything; selection can choose individual tag names, metadata fields, profile URL, and social-link URLs. New-author creation and manga assignment remain one atomic item; any or all proposed social channels may be omitted' : 'Reject a pending draft'}. Call only when the user explicitly authorizes this action. First show the user get_metadata_draft results; supply its review_token. A stale review fails. Identical completed decisions are safe to retry.`,
          inputSchema: { draft_id: id, review_token: z.string().regex(/^[a-f0-9]{64}$/), confirm: z.literal(true), ...(action === 'apply' ? { selection: approvalSelection.optional() } : {}) },
          annotations: { readOnlyHint: false, destructiveHint: action === 'apply', idempotentHint: true, openWorldHint: false },
        }, async (args) => {
          try {
            requireScope(key, 'catalog:read'); requireScope(key, 'metadata:write');
            const data = await review.decide(args.draft_id, args.review_token, action, key, requestId, action === 'apply' ? approvalSelection.optional().parse(args.selection) : undefined);
            return { content: [{ type: 'text' as const, text: JSON.stringify({ data }) }], structuredContent: { data } };
          } catch { return { isError: true, content: [{ type: 'text' as const, text: 'Draft decision failed; refresh the draft and review before retrying' }] }; }
        });
      }
    }
  }
  return server;
}

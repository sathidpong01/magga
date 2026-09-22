import { and, eq, sql } from 'drizzle-orm';
import type { db as database } from '@/db';
import { profiles } from '@/db/schema';
import { mcpApiKeys, mcpAuditEvents } from '@/db/mcp-schema';
import { createCatalog } from './metadata-service';
import type { Dependencies } from './http';
import { createDraftService } from './drafts';
import { createReviewService } from './review';

export function createDependencies(db: typeof database): Dependencies { return {
  lookup: async (hash) => {
    const [row] = await db.select({ id: mcpApiKeys.id, ownerUserId: mcpApiKeys.ownerUserId, name: mcpApiKeys.name, scopes: mcpApiKeys.scopes, secretHash: mcpApiKeys.secretHash, expiresAt: mcpApiKeys.expiresAt, revokedAt: mcpApiKeys.revokedAt, role: profiles.role, banned: sql<boolean>`(${profiles.isBanned} OR coalesce(${profiles.banned}, false))` }).from(mcpApiKeys).innerJoin(profiles, eq(profiles.id, mcpApiKeys.ownerUserId)).where(eq(mcpApiKeys.secretHash, hash)).limit(1);
    return row;
  },
  consume: async (id) => {
    // One conditional UPDATE serializes concurrent requests across Vercel instances.
    const reset = sql`${mcpApiKeys.windowStart} <= now() - interval '1 minute'`;
    const rows = await db.update(mcpApiKeys).set({
      windowStart: sql`CASE WHEN ${reset} THEN now() ELSE ${mcpApiKeys.windowStart} END`,
      requestCount: sql`CASE WHEN ${reset} THEN 1 ELSE ${mcpApiKeys.requestCount} + 1 END`,
      lastUsedAt: sql`now()`,
    }).where(and(eq(mcpApiKeys.id, id), sql`${mcpApiKeys.revokedAt} IS NULL AND ${mcpApiKeys.expiresAt} > now()`, sql`(${reset} OR ${mcpApiKeys.requestCount} < 60)`)).returning({ id: mcpApiKeys.id });
    return rows.length === 1;
  },
  catalog: createCatalog(db),
  drafts: createDraftService(db, process.env.MCP_PUBLIC_SOURCE_HOSTS === undefined ? undefined : process.env.MCP_PUBLIC_SOURCE_HOSTS.split(',').map((host) => host.trim().toLowerCase()).filter(Boolean)),
  review: createReviewService(db, async () => {
    const { revalidatePath, revalidateTag } = await import('next/cache');
    revalidateTag('manga-list', 'max');
    revalidatePath('/', 'layout');
  }, process.env.MCP_PUBLIC_SOURCE_HOSTS === undefined ? undefined : process.env.MCP_PUBLIC_SOURCE_HOSTS.split(',').map((host) => host.trim().toLowerCase()).filter(Boolean)),
  audit: async (event) => { await db.insert(mcpAuditEvents).values(event); },
}; }

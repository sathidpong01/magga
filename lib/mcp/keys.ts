import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { db as database } from '@/db';
import { profiles } from '@/db/schema';
import { mcpApiKeys } from '@/db/mcp-schema';
import { generateKey } from './auth';

const keyInput = z.object({ owner: z.string().min(1).max(200), name: z.string().trim().min(1).max(80), scopes: z.array(z.enum(['catalog:read','draft:write','metadata:write'])).min(1), expires: z.coerce.date() }).strict();
// Trusted operator only. Never expose this service as an MCP tool or HTTP route.
export function createKeyAdmin(db: typeof database) {
  return {
    async issue(raw: z.input<typeof keyInput>) {
      const input = keyInput.parse(raw);
      if (input.expires <= new Date() || input.expires.getTime() > Date.now() + 366 * 86400000) throw new Error('Expiry must be within one year');
      if (!input.scopes.includes('catalog:read')) throw new Error('Catalog scope required');
      return db.transaction(async (tx) => {
        const [owner] = await tx.select({ id: profiles.id }).from(profiles).where(and(eq(profiles.id, input.owner), eq(profiles.role, 'admin'), eq(profiles.isBanned, false), sql`coalesce(${profiles.banned}, false) = false`)).for('share');
        if (!owner) throw new Error('Owner unavailable');
        const secret = generateKey();
        const [key] = await tx.insert(mcpApiKeys).values({ ownerUserId: owner.id, name: input.name, scopes: [...new Set(input.scopes)], expiresAt: input.expires, secretHash: secret.secretHash, keyPrefix: secret.keyPrefix }).returning({ id: mcpApiKeys.id, name: mcpApiKeys.name, keyPrefix: mcpApiKeys.keyPrefix, scopes: mcpApiKeys.scopes, expiresAt: mcpApiKeys.expiresAt });
        return { ...key, token: secret.token };
      });
    },
    async list(owner: string) {
      return db.select({ id: mcpApiKeys.id, name: mcpApiKeys.name, keyPrefix: mcpApiKeys.keyPrefix, scopes: mcpApiKeys.scopes, expiresAt: mcpApiKeys.expiresAt, revokedAt: mcpApiKeys.revokedAt, lastUsedAt: mcpApiKeys.lastUsedAt }).from(mcpApiKeys).where(eq(mcpApiKeys.ownerUserId, owner)).orderBy(desc(mcpApiKeys.createdAt));
    },
    async revoke(owner: string, id: string) {
      z.string().uuid().parse(id);
      const rows = await db.update(mcpApiKeys).set({ revokedAt: sql`coalesce(${mcpApiKeys.revokedAt}, now())`, updatedAt: new Date() }).where(and(eq(mcpApiKeys.id, id), eq(mcpApiKeys.ownerUserId, owner))).returning({ id: mcpApiKeys.id, revokedAt: mcpApiKeys.revokedAt });
      if (!rows.length) throw new Error('Key unavailable');
      return rows[0];
    },
  };
}

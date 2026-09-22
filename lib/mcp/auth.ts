import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const scopes = ['catalog:read', 'research:read', 'draft:write', 'metadata:write'] as const;
export type Scope = typeof scopes[number];
export type Principal = { id: string; ownerUserId: string; name: string; scopes: string[] };
export type KeyRecord = Principal & { secretHash: string; expiresAt: Date; revokedAt: Date | null; role: string; banned: boolean };
export class AccessError extends Error {
  constructor(public status: number) { super(status === 429 ? 'Rate limit exceeded' : 'Access denied'); }
}
export function hashToken(token: string) { return createHash('sha256').update(token).digest('hex'); }
export function generateKey() {
  const token = `mgm_${randomBytes(32).toString('hex')}`;
  return { token, secretHash: hashToken(token), keyPrefix: token.slice(0, 12) };
}
export async function authenticate(header: string | null, lookup: (hash: string) => Promise<KeyRecord | undefined>, now = new Date()): Promise<Principal> {
  const match = /^Bearer (mgm_[a-f0-9]{64})$/i.exec(header ?? '');
  if (!match) throw new AccessError(401);
  const hash = hashToken(match[1]);
  const key = await lookup(hash);
  if (!key || !/^[a-f0-9]{64}$/.test(key.secretHash) || !timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(key.secretHash, 'hex')) || key.revokedAt || !Number.isFinite(key.expiresAt.getTime()) || key.expiresAt <= now || key.role !== 'admin' || key.banned) throw new AccessError(401);
  return { id: key.id, ownerUserId: key.ownerUserId, name: key.name, scopes: key.scopes };
}
export function requireScope(key: Principal, scope: Scope) {
  if (!key.scopes.includes(scope)) throw new AccessError(403);
}

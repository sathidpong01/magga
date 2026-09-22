import { describe, expect, it, vi } from 'vitest';
import { authenticate, generateKey, requireScope, type KeyRecord } from '@/lib/mcp/auth';

describe('MCP bearer authentication', () => {
  const secret = generateKey();
  const record: KeyRecord = { id: 'key', ownerUserId: 'owner', name: 'test', scopes: ['catalog:read'], secretHash: secret.secretHash, expiresAt: new Date('2099-01-01'), revokedAt: null, role: 'admin', banned: false };
  it.each([null, '', 'Basic abc', 'Bearer short', `Bearer ${secret.token} extra`])('rejects malformed authorization %s', async (header) => {
    const lookup = vi.fn(); await expect(authenticate(header, lookup)).rejects.toMatchObject({ status: 401 }); expect(lookup).not.toHaveBeenCalled();
  });
  it.each([{ revokedAt: new Date() }, { expiresAt: new Date(0) }, { expiresAt: new Date('invalid') }, { role: 'user' }, { banned: true }, { secretHash: 'bad' }])('rejects invalid key state %j', async (patch) => {
    await expect(authenticate(`Bearer ${secret.token}`, async () => ({ ...record, ...patch }))).rejects.toMatchObject({ status: 401 });
  });
  it('rejects an unknown key', async () => { await expect(authenticate(`Bearer ${secret.token}`, async () => undefined)).rejects.toMatchObject({ status: 401 }); });
  it('returns only identity and scopes; never token/hash', async () => {
    const result = await authenticate(`Bearer ${secret.token}`, async () => record);
    expect(result).toEqual({ id: 'key', ownerUserId: 'owner', name: 'test', scopes: ['catalog:read'] });
    expect(() => requireScope(result, 'metadata:write')).toThrow('Access denied');
  });
  it('generates independent 256-bit secrets', () => { expect(generateKey().token).not.toBe(secret.token); expect(secret.secretHash).not.toContain(secret.token); });
});

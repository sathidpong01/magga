import { describe, expect, it, vi } from 'vitest';
import { draftFilters, readAdminDrafts } from '@/lib/mcp/admin-read';
import type { db as database } from '@/db';

function fake(results: unknown[][]) {
  const select = vi.fn((columns: Record<string, unknown>) => {
    void columns;
    const result = results.shift() ?? [];
    const chain: Record<string, unknown> = {};
    for (const name of ['from', 'where', 'limit', 'offset', 'orderBy', 'innerJoin']) chain[name] = () => chain;
    chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve);
    return chain;
  });
  const transaction = vi.fn(async (run: (tx: unknown) => unknown) => run({ select }));
  return { db: { transaction } as unknown as typeof database, select, transaction };
}
describe('browser draft inspection', () => {
  it('bounds pagination and rejects malformed filter input', () => {
    expect(draftFilters({ page: '-2', status: 'unknown', draft: '<script>' })).toEqual({ page: 1, status: 'all', id: undefined });
    expect(draftFilters({ page: '9999', status: 'pending' }).page).toBe(1000);
    expect(draftFilters({ page: ['2'], status: ['applied'] }).page).toBe(1);
  });
  it('does not query drafts if current database administrator check fails', async () => {
    const f = fake([[]]);
    await expect(readAdminDrafts(f.db, 'revoked-admin', draftFilters({}))).rejects.toThrow('Admin access required');
    expect(f.select).toHaveBeenCalledTimes(1);
  });
  it('uses a read-only consistent transaction and returns a usable empty state', async () => {
    const f = fake([[{ id: 'admin' }], []]);
    const result = await readAdminDrafts(f.db, 'admin', draftFilters({}));
    expect(result.rows).toEqual([]);
    expect(result.selected).toBeNull();
    expect(f.transaction).toHaveBeenCalledWith(expect.any(Function), { accessMode: 'read only', isolationLevel: 'repeatable read' });
    const serializedColumns = f.select.mock.calls.map(call => Object.keys(call[0] ?? {}));
    expect(serializedColumns.flat()).not.toContain('secretHash');
  });
});

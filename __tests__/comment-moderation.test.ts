import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ actor: vi.fn(), origin: vi.fn(), quota: vi.fn(), select: vi.fn(), update: vi.fn(), insert: vi.fn(), transaction: vi.fn(), retire: vi.fn() }));
vi.mock('@/lib/comments/assets',()=>({retireCommentAssets:mocks.retire}));
vi.mock('@/db', () => ({ db: { select: mocks.select, transaction: mocks.transaction } }));
vi.mock('@/lib/comments/identity', () => ({ requireCommentActor: mocks.actor, assertCommentOrigin: mocks.origin }));
vi.mock('@/lib/comments/abuse', () => ({ consumeCommentLimit: mocks.quota }));
import { moderateComments, parseModerationBody, parseReportBody, requireModerationAdmin } from '@/lib/comments/moderation';
const id = '12345678-1234-4234-8234-123456789abc';
const request = new Request('https://magga.example/api/admin/comments', { method: 'PATCH', headers: { origin: 'https://magga.example' } });

function selection(rows: unknown[]) {
  const query:any = {}; for (const key of ["from","where","orderBy"]) query[key]=()=>query; query.limit=async()=>rows; query.for=async()=>rows; return query;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.actor.mockResolvedValue({ kind: 'member', userId: 'admin', role: 'admin', name: 'Admin' });
  mocks.select.mockReturnValue(selection([{ id: 'admin', role: 'admin', isBanned: false, banned: false }]));
  mocks.quota.mockResolvedValue(undefined);
});

describe('comment moderation safety', () => {
  it('rejects guest admins, revoked roles, and either ban flag before moderation writes', async () => {
    mocks.actor.mockResolvedValueOnce({ kind: 'guest', guestId: id, role: 'admin' });
    await expect(requireModerationAdmin(request, true)).rejects.toThrow();
    for (const row of [{ role: 'user' }, { role: 'admin', isBanned: true }, { role: 'admin', banned: true }]) {
      mocks.select.mockReturnValueOnce(selection([row]));
      await expect(requireModerationAdmin(request, true)).rejects.toThrow();
    }
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.quota).not.toHaveBeenCalled();
  });
  it('fails closed if Origin or quota checks reject', async () => {
    mocks.origin.mockImplementationOnce(() => { throw new Error('cross-site'); });
    await expect(moderateComments(request, { commentIds: [id], action: 'delete' })).rejects.toThrow('cross-site');
    mocks.quota.mockRejectedValueOnce(new Error('database unavailable'));
    await expect(moderateComments(request, { commentIds: [id], action: 'delete' })).rejects.toThrow('database unavailable');
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('permanently erases selected content in a transaction and retains replies and votes', async () => {
    const set = vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) }));
    const values = vi.fn().mockResolvedValue([]);
    const tx = { select: () => selection([{ id, guestId: null }]), update: vi.fn(() => ({ set })), insert: vi.fn(() => ({ values })) };
    mocks.transaction.mockImplementation(async run => run(tx));
    await expect(moderateComments(request, { commentIds: [id], action: 'delete', reason: 'Spam' })).resolves.toEqual({ updated: 1, deleted: 1 });
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ status: 'deleted' }));
    expect(tx.update).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith(expect.objectContaining({content:'',imageUrl:null}));
    expect(mocks.retire).toHaveBeenCalledWith(tx,id);
    expect(values).toHaveBeenCalledWith([expect.objectContaining({ commentId: id, actorUserId: 'admin', action: 'delete', reason: 'Spam' })]);
    expect('delete' in tx).toBe(false);
  });
  it('bounds and validates bulk requests, report reasons and details', () => {
    expect(parseModerationBody({ commentIds: [id, id], action: 'delete' }).commentIds).toEqual([id]);
    for (const body of [{ commentIds: ['wrong'], action: 'publish' }, { commentIds: Array(101).fill(id), action: 'publish' }, { commentIds: [id], action: 'erase-database' }, {commentIds:[id],action:'hide'}]) expect(() => parseModerationBody(body)).toThrow();
    expect(() => parseReportBody({ reason: 'spam', details: 'a'.repeat(501) })).toThrow();
    expect(() => parseReportBody({ reason: 'delete-all' })).toThrow();
  });
  it.each(['publish','hide'])('rejects removed %s capabilities before any mutation',async(action)=>{
    await expect(moderateComments(request,{commentIds:[id],action})).rejects.toThrow('Invalid moderation action');
    expect(mocks.transaction).not.toHaveBeenCalled();expect(mocks.retire).not.toHaveBeenCalled();
  });
});

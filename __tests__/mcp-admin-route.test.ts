import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ session: vi.fn(), decide: vi.fn(), get: vi.fn(), factory: vi.fn() }));
vi.mock('@/db', () => ({ db: {} }));
vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: mocks.session } } }));
vi.mock('@/lib/mcp/review', () => ({ createBrowserReviewService: mocks.factory }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
import { POST, GET } from '@/app/api/admin/mcp-drafts/[id]/route';
const id = 'ad3c9620-185c-4f29-a452-38b062bd672b';
const ctx = { params: Promise.resolve({ id }) };
const input = { action: 'apply', review_token: 'a'.repeat(64), confirm: true };
function request(body: unknown = input, origin: string | null = 'https://preview.example') {
  return new Request(`https://preview.example/api/admin/mcp-drafts/${id}`, { method: 'POST', headers: { 'content-type': 'application/json', ...(origin ? { origin } : {}) }, body: JSON.stringify(body) });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({ user: { id: 'signed-in-admin', role: 'admin' } });
  mocks.factory.mockReturnValue({ get: mocks.get, decide: mocks.decide });
  mocks.decide.mockResolvedValue({ status: 'applied', cache_refresh_pending: false });
});
it.each([null, 'https://foreign.example'])('rejects missing or foreign origin before authentication', async origin => {
  expect((await POST(request(input, origin), ctx)).status).toBe(403);
  expect(mocks.session).not.toHaveBeenCalled();
});
it.each([null, { user: { id: 'user', role: 'user' } }, { user: { id: 'admin', role: 'admin', banned: true } }, { user: { id: 'admin', role: 'admin', isBanned: true } }])('rejects non-administrator sessions', async session => {
  mocks.session.mockResolvedValue(session);
  expect((await POST(request(), ctx)).status).toBe(403);
  expect((await GET(new Request('https://preview.example/api/admin/mcp-drafts/'+id), ctx)).status).toBe(403);
  expect(mocks.factory).not.toHaveBeenCalled();
});
it.each([{ ...input, confirm: false }, { ...input, review_token: 'bad' }, { ...input, userId: 'another-admin' }])('requires confirmation and rejects extra identity fields', async body => {
  expect((await POST(request(body), ctx)).status).toBe(400);
  expect(mocks.decide).not.toHaveBeenCalled();
});
it('binds decisions to session identity and returns uncacheable committed result', async () => {
  const result = await POST(request(), ctx);
  expect(result.status).toBe(200);
  expect(result.headers.get('cache-control')).toBe('no-store');
  expect(mocks.factory).toHaveBeenCalledWith({}, 'signed-in-admin', expect.any(Function), undefined);
  expect(mocks.decide).toHaveBeenCalledWith(id, input.review_token, 'apply', expect.any(String), undefined);
});
it('validates and forwards an approval subset', async () => {
  const selection = { tag_names: ['First Time'] };
  expect((await POST(request({...input,selection}),ctx)).status).toBe(200);
  expect(mocks.decide).toHaveBeenCalledWith(id,input.review_token,'apply',expect.any(String),selection);
  expect((await POST(request({action:'reject',review_token:input.review_token,confirm:true,selection}),ctx)).status).toBe(400);
});
it('returns a conflict without exposing internal exceptions', async () => {
  mocks.decide.mockRejectedValue(new Error('private database error'));
  const response = await POST(request(), ctx);
  expect(response.status).toBe(409);
  expect(await response.text()).not.toContain('private database error');
});
it('bounds streamed payload size before calling the decision service', async () => {
  expect((await POST(request({ ...input, junk: 'x'.repeat(40000) }), ctx)).status).toBe(413);
  expect(mocks.decide).not.toHaveBeenCalled();
});
it('checks the browser Host when Next normalizes its internal loopback URL', async () => {
  const req = new Request(`http://localhost:3100/api/admin/mcp-drafts/${id}`, { method: 'POST', headers: { host: '127.0.0.1:3100', origin: 'http://127.0.0.1:3100', 'content-type': 'application/json' }, body: JSON.stringify(input) });
  expect((await POST(req, ctx)).status).toBe(200);
});
it('does not accept a forged forwarded host as a same-origin request', async () => {
  const req = request(input, 'https://foreign.example');
  req.headers.set('host', 'preview.example'); req.headers.set('x-forwarded-host', 'foreign.example');
  expect((await POST(req, ctx)).status).toBe(403);
});

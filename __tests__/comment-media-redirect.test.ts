import { beforeEach, describe, expect, it, jest, mock } from 'bun:test';

const mocks = { resolveUrl: jest.fn() };
mock.module('@/lib/comments/assets', () => ({ readPublishedCommentAsset: mocks.resolveUrl }));
mock.module('@/lib/comments', () => ({ handleCommentError: () => Response.json({ error: 'Unavailable' }, { status: 404 }) }));
const { GET } = await import('@/app/api/comments/media/[id]/route');

beforeEach(() => jest.clearAllMocks());
describe('legacy comment media never proxies file bytes', () => {
  it('redirects to direct R2 without returning a body or allowing redirect caching', async () => {
    const id = '11111111-1111-4111-8111-111111111111';
    const url = `https://public-comments.example/comments/${id}.webp`;
    mocks.resolveUrl.mockResolvedValue(url);
    const request = new Request(`https://magga.example/api/comments/media/${id}`);
    const response = await GET(request, { params: Promise.resolve({ id }) });
    expect(mocks.resolveUrl).toHaveBeenCalledWith(id, request.headers);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(url);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.text()).toBe('');
  });
  it('does not issue a redirect when asset authorization fails', async () => {
    mocks.resolveUrl.mockRejectedValue(new Error('Denied'));
    const id = '11111111-1111-4111-8111-111111111111';
    const response = await GET(new Request(`https://magga.example/api/comments/media/${id}`), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(404);
    expect(response.headers.get('location')).toBeNull();
  });
});

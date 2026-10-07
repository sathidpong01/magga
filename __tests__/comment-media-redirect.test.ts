import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ resolveUrl: vi.fn() }));
vi.mock('@/lib/comments/assets', () => ({ readPublishedCommentAsset: mocks.resolveUrl }));
vi.mock('@/lib/comments', () => ({ handleCommentError: () => Response.json({ error: 'Unavailable' }, { status: 404 }) }));
import { GET } from '@/app/api/comments/media/[id]/route';

beforeEach(() => vi.clearAllMocks());
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

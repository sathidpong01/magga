import { beforeEach, describe, expect, it, jest, mock } from 'bun:test';
const mocks = { origin: jest.fn(), actor: jest.fn(), verify: jest.fn(), quota: jest.fn(), asset: jest.fn() };
mock.module('@/lib/comments/identity', () => ({ assertSameOrigin: mocks.origin, requireCommentActor: mocks.actor, ensureGuestVerification: mocks.verify }));
mock.module('@/lib/comments/abuse', () => ({ consumeCommentLimit: mocks.quota }));
mock.module('@/lib/comments/assets', () => ({ createCommentAsset: mocks.asset }));
mock.module('@/lib/comments', () => ({ handleCommentError: (error: Error & { status?: number }) => Response.json({ error: error.message }, { status: error.status || 503 }) }));
const { POST } = await import('@/app/api/comments/upload/route');
const { COMMENT_IMAGE_MAX_BYTES } = await import('@/lib/comments/image-processing');
const actor = { kind: 'guest', guestId: 'guest', sessionId: 'session', name: 'Guest', publicCode: 'AA11' };
beforeEach(() => {
  jest.clearAllMocks(); mocks.actor.mockResolvedValue(actor); mocks.verify.mockResolvedValue(undefined); mocks.quota.mockResolvedValue(undefined); mocks.asset.mockResolvedValue({ assetId: 'asset' });
});
const request = (length = '100') => new Request('https://magga.example/api/comments/upload', { method: 'POST', headers: { origin: 'https://magga.example', 'content-length': length } });

describe('guest image upload route guard ordering', () => {
  it('rejects cross-site or absent actors before parsing body or touching storage', async () => {
    const req = request(); const form = jest.spyOn(req, 'formData');
    mocks.origin.mockImplementationOnce(() => { throw new Error('origin rejected'); });
    expect((await POST(req)).status).toBe(503);
    mocks.actor.mockRejectedValueOnce(new Error('unauthorized'));
    expect((await POST(req)).status).toBe(503);
    expect(form).not.toHaveBeenCalled(); expect(mocks.quota).not.toHaveBeenCalled(); expect(mocks.asset).not.toHaveBeenCalled();
  });
  it('rejects oversized or invalid request lengths before multipart decode', async () => {
    for (const length of ['0', '-1', 'NaN', String(COMMENT_IMAGE_MAX_BYTES + 65537)]) {
      const req = request(length); const form = jest.spyOn(req, 'formData');
      expect((await POST(req)).status).toBe(400); expect(form).not.toHaveBeenCalled();
    }
    expect(mocks.asset).not.toHaveBeenCalled();
  });
  it('fails closed on quota failure before multipart parsing or image processing', async () => {
    const req = request(); const form = jest.spyOn(req, 'formData');
    mocks.quota.mockRejectedValueOnce(new Error('quota unavailable'));
    expect((await POST(req)).status).toBe(503); expect(form).not.toHaveBeenCalled(); expect(mocks.asset).not.toHaveBeenCalled();
  });
  it('requires successful guest verification before image processing and returns private response', async () => {
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const boundary = 'magga-upload-fixture';
    const bytes = new TextEncoder().encode(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.png"\r\nContent-Type: image/png\r\n\r\ntest\r\n--${boundary}\r\nContent-Disposition: form-data; name="challengeToken"\r\n\r\nchallenge\r\n--${boundary}--\r\n`);
    const make=()=>new Request('https://magga.example/api/comments/upload',{method:'POST',headers:{origin:'https://magga.example','content-type':`multipart/form-data; boundary=${boundary}`,'content-length':String(bytes.byteLength)},body:bytes});
    const req=make();
    mocks.verify.mockRejectedValueOnce(new Error('bot check failed'));
    expect((await POST(req)).status).toBe(503); expect(mocks.asset).not.toHaveBeenCalled();
    const response = await POST(make());
    expect(response.status).toBe(200); expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(mocks.verify).toHaveBeenLastCalledWith(actor, req.headers, 'challenge');
    const parsed=mocks.asset.mock.calls[0][1] as File;expect(parsed.name).toBe(file.name);expect(await parsed.text()).toBe('test');
  });
  it('bounds actual upload bytes before multipart decoding despite a forged small length', async()=>{
    const req=new Request('https://magga.example/api/comments/upload',{method:'POST',headers:{origin:'https://magga.example','content-type':'multipart/form-data; boundary=test','content-length':'100'},body:'x'.repeat(COMMENT_IMAGE_MAX_BYTES+65537)});
    expect((await POST(req)).status).toBe(413);expect(mocks.asset).not.toHaveBeenCalled();expect(mocks.verify).not.toHaveBeenCalled();
  });
});

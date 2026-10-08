import { stubEnv, restoreEnvs } from "./helpers/env";
import { afterEach, beforeEach, describe, expect, it, jest, mock } from 'bun:test';
const mocks = { send: jest.fn(), client: jest.fn(), sign: jest.fn() };
mock.module('@aws-sdk/client-s3', () => ({
  S3Client: class { send = mocks.send; constructor(options: unknown) { mocks.client(options); } },
  PutObjectCommand: class { constructor(public input: unknown) {} },
  GetObjectCommand: class { constructor(public input: unknown) {} },
  DeleteObjectCommand: class { constructor(public input: unknown) {} },
  CopyObjectCommand: class { constructor(public input: unknown) {} },
}));
mock.module('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: mocks.sign }));
const { getCommentPrivateStorage } = await import('@/lib/storage/comment-private');
const { COMMENT_IMAGE_MAX_BYTES } = await import('@/lib/comments/image-processing');
const objectKey = 'comments/11111111-1111-4111-8111-111111111111.webp';
beforeEach(() => {
  jest.resetAllMocks();
  for (const [key, value] of Object.entries({ R2_COMMENT_BUCKET_NAME: 'private-comments', R2_COMMENT_PUBLIC_BUCKET_NAME: 'published-comments', R2_COMMENT_PUBLIC_URL: 'https://comments.example.com', R2_BUCKET_NAME: 'public-manga', R2_ACCOUNT_ID: 'test-account', R2_ACCESS_KEY_ID: 'test-access', R2_SECRET_ACCESS_KEY: 'test-secret', R2_COMMENT_ACCESS_KEY_ID: '', R2_COMMENT_SECRET_ACCESS_KEY: '' })) stubEnv(key, value);
});
afterEach(() => restoreEnvs());
describe('private comment object storage', () => {
  it('fails closed for absent private bucket and refuses the public manga bucket', () => {
    stubEnv('R2_COMMENT_BUCKET_NAME', '');
    expect(() => getCommentPrivateStorage()).toThrow();
    stubEnv('R2_COMMENT_BUCKET_NAME', 'public-manga');
    expect(() => getCommentPrivateStorage()).toThrow();
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it('never requests a public ACL or publicly cached uploaded object', async () => {
    mocks.send.mockResolvedValue({});
    await getCommentPrivateStorage().put(objectKey, Buffer.from('image'), 'image/webp');
    expect(mocks.send.mock.calls[0][0].input).toEqual(expect.objectContaining({ Bucket: 'private-comments', CacheControl: 'private, no-store', ContentType: 'image/webp' }));
    expect(mocks.send.mock.calls[0][0].input.ACL).toBeUndefined();
  });
  it('rejects object sizes before reading and verifies actual length after reading', async () => {
    const read = jest.fn().mockResolvedValue(new Uint8Array(COMMENT_IMAGE_MAX_BYTES + 1));
    mocks.send.mockResolvedValueOnce({ ContentLength: COMMENT_IMAGE_MAX_BYTES + 1, Body: { transformToByteArray: read } });
    await expect(getCommentPrivateStorage().get(objectKey)).rejects.toThrow();
    expect(read).not.toHaveBeenCalled();
    mocks.send.mockResolvedValueOnce({ ContentLength: 10, Body: { transformToByteArray: read } });
    await expect(getCommentPrivateStorage().get(objectKey)).rejects.toThrow();
    expect(read).toHaveBeenCalledTimes(1);
  });
  it('returns null for missing objects but propagates storage failures', async () => {
    mocks.send.mockRejectedValueOnce(Object.assign(new Error('missing'), { name: 'NoSuchKey' }));
    await expect(getCommentPrivateStorage().get(objectKey)).resolves.toBeNull();
    mocks.send.mockRejectedValueOnce(new Error('network failure'));
    await expect(getCommentPrivateStorage().get(objectKey)).rejects.toThrow('network failure');
  });
  it.each(['private-comments', 'public-manga', ''])('refuses public bucket %s', publicBucket => {
    stubEnv('R2_COMMENT_PUBLIC_BUCKET_NAME', publicBucket);
    expect(() => getCommentPrivateStorage()).toThrow();
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it.each(['', 'http://comments.example.com', 'https://user:pass@comments.example.com', 'https://comments.example.com/path', 'https://comments.example.com?token=1', 'https://comments.example.com#hash', 'https://comments.example.com:8443', 'https://test-account.r2.cloudflarestorage.com', 'https://localhost', ' https://comments.example.com', 'https://comments.example.com/%2f'])('refuses invalid public origin %s', url => {
    stubEnv('R2_COMMENT_PUBLIC_URL', url);
    expect(() => getCommentPrivateStorage()).toThrow();
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it('copies privately staged bytes inside R2 with webp and no-store metadata', async () => {
    mocks.send.mockResolvedValue({});
    await expect(getCommentPrivateStorage().publish(objectKey)).resolves.toBe(`https://comments.example.com/${objectKey}`);
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.send.mock.calls[0][0].input).toEqual({ Bucket: 'published-comments', Key: objectKey, CopySource: `private-comments/${objectKey}`, MetadataDirective: 'REPLACE', ContentType: 'image/webp', CacheControl: 'no-store, max-age=0' });
    expect(mocks.client.mock.calls[0][0].maxAttempts).toBe(2);
  });
  it('does not return a published URL when the R2 copy fails', async () => {
    const failure = new Error('copy failed');
    mocks.send.mockRejectedValue(failure);
    await expect(getCommentPrivateStorage().publish(objectKey)).rejects.toBe(failure);
  });
  it('signs a short private R2 GET without fetching the object through the app', async () => {
    mocks.sign.mockResolvedValue('https://test-account.r2.cloudflarestorage.com/private-comments/signed');
    await expect(getCommentPrivateStorage().previewUrl(objectKey)).resolves.toContain('.r2.cloudflarestorage.com/');
    expect(mocks.sign.mock.calls[0][1].input).toEqual({ Bucket: 'private-comments', Key: objectKey, ResponseCacheControl: 'private, no-store' });
    expect(mocks.sign.mock.calls[0][2]).toEqual({ expiresIn: 60 });
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it('deletes the exact key in both buckets immediately and is idempotent', async () => {
    mocks.send.mockResolvedValue({});
    const storage = getCommentPrivateStorage();
    await storage.delete(objectKey);
    await storage.delete(objectKey);
    expect(mocks.send.mock.calls.map(([command]) => command.input)).toEqual([
      { Bucket: 'published-comments', Key: objectKey }, { Bucket: 'private-comments', Key: objectKey },
      { Bucket: 'published-comments', Key: objectKey }, { Bucket: 'private-comments', Key: objectKey },
    ]);
  });
  it('attempts private deletion even when public deletion fails, preserving the failure', async () => {
    const failure = new Error('delete failed');
    mocks.send.mockRejectedValueOnce(failure).mockResolvedValueOnce({});
    await expect(getCommentPrivateStorage().delete(objectKey)).rejects.toBe(failure);
    expect(mocks.send.mock.calls.map(([command]) => command.input.Bucket)).toEqual(['published-comments', 'private-comments']);
  });
  it('unpublishes only the public copy', async () => {
    mocks.send.mockResolvedValue({});
    await getCommentPrivateStorage().unpublish(objectKey);
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.send.mock.calls[0][0].input).toEqual({ Bucket: 'published-comments', Key: objectKey });
  });
  it('discards only the exact private staging copy and permits repeated cleanup', async () => {
    mocks.send.mockResolvedValue({});
    const storage = getCommentPrivateStorage();
    await storage.discardStaging(objectKey);
    await storage.discardStaging(objectKey);
    expect(mocks.send.mock.calls.map(([command]) => command.input)).toEqual([
      { Bucket: 'private-comments', Key: objectKey }, { Bucket: 'private-comments', Key: objectKey },
    ]);
  });
  it('preserves staging cleanup errors so the caller can retry', async () => {
    const failure = new Error('staging delete failed');
    mocks.send.mockRejectedValue(failure);
    await expect(getCommentPrivateStorage().discardStaging(objectKey)).rejects.toBe(failure);
  });
  it.each(['manga/11111111-1111-4111-8111-111111111111.webp', '../comments/11111111-1111-4111-8111-111111111111.webp', 'comments/test.webp', `${objectKey}?extra=1`, objectKey.replace('.webp', '.png')])('refuses unsafe key %s before any storage action', async key => {
    const storage = getCommentPrivateStorage();
    expect(() => storage.publicUrl(key)).toThrow();
    await expect(storage.put(key, Buffer.from('image'), 'image/webp')).rejects.toThrow();
    await expect(storage.get(key)).rejects.toThrow();
    await expect(storage.publish(key)).rejects.toThrow();
    await expect(storage.previewUrl(key)).rejects.toThrow();
    await expect(storage.unpublish(key)).rejects.toThrow();
    await expect(storage.discardStaging(key)).rejects.toThrow();
    await expect(storage.delete(key)).rejects.toThrow();
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.sign).not.toHaveBeenCalled();
  });
  it('rejects invalid upload bodies and non-webp content types', async () => {
    const storage = getCommentPrivateStorage();
    await expect(storage.put(objectKey, Buffer.alloc(0), 'image/webp')).rejects.toThrow();
    await expect(storage.put(objectKey, Buffer.alloc(COMMENT_IMAGE_MAX_BYTES + 1), 'image/webp')).rejects.toThrow();
    await expect(storage.put(objectKey, Buffer.from('image'), 'image/png')).rejects.toThrow();
    expect(mocks.send).not.toHaveBeenCalled();
  });
});

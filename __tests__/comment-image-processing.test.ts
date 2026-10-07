import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { COMMENT_IMAGE_MAX_BYTES, processCommentImage } from '@/lib/comments/image-processing';

const file = (data: Buffer, type = 'image/png') => new File([new Uint8Array(data)], 'image.png', { type });
describe('comment image decode and re-encoding boundaries', () => {
  it('preserves supported GIF animation and rejects an excessive frame count', async () => {
    const pixels = Buffer.concat([Buffer.from([255,0,0]).subarray(0,3),Buffer.from([0,255,0]).subarray(0,3)]);
    const gif = await sharp(pixels, { raw: { width: 1, height: 2, channels: 3, pageHeight: 1 } }).gif({ delay: [100,100], loop: 0 }).toBuffer();
    expect((await sharp(gif, { animated: true }).metadata()).pages).toBe(2);
    const result = await processCommentImage(file(gif, 'image/gif'));
    expect((await sharp(result.data, { animated: true }).metadata()).pages).toBe(2);
    const many = Buffer.alloc(61*3);
    for(let i=0;i<61;i++) many[i*3+(i%2)]=255;
    const excessive = await sharp(many, { raw: { width: 1, height: 61, channels: 3, pageHeight: 1 } }).gif({ delay: Array(61).fill(100) }).toBuffer();
    expect((await sharp(excessive, { animated: true }).metadata()).pages).toBe(61);
    await expect(processCommentImage(file(excessive, 'image/gif'))).rejects.toThrow();
  });
  it('limits both dimensions while preserving aspect ratio and outputs WebP', async () => {
    const input = await sharp({ create: { width: 100, height: 2000, channels: 4, background: { r: 1, g: 2, b: 3, alpha: 0.5 } } }).png().toBuffer();
    const result = await processCommentImage(file(input));
    expect(result).toMatchObject({ width: 40, height: 800, contentType: 'image/webp' });
    expect(result.bytes).toBeLessThanOrEqual(COMMENT_IMAGE_MAX_BYTES);
    expect((await sharp(result.data).metadata()).format).toBe('webp');
  });
  it('applies orientation and strips EXIF, GPS and embedded metadata', async () => {
    const input = await sharp({ create: { width: 60, height: 30, channels: 3, background: 'red' } }).jpeg().withMetadata({ orientation: 6, exif: { IFD0: { Copyright: 'private metadata' }, IFD2: { UserComment: 'private location' } } }).toBuffer();
    const result = await processCommentImage(file(input, 'image/jpeg'));
    expect(result).toMatchObject({ width: 30, height: 60 });
    const metadata = await sharp(result.data).metadata();
    expect(metadata.exif).toBeUndefined();
    expect(metadata.orientation).toBeUndefined();
    expect(metadata.icc).toBeUndefined();
  });
  it('rejects MIME/signature mismatch, SVG, truncated images and oversize files', async () => {
    const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: 'red' } }).png().toBuffer();
    for (const image of [file(png, 'image/jpeg'), file(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'), 'image/svg+xml'), file(png.subarray(0, 20)), file(Buffer.alloc(COMMENT_IMAGE_MAX_BYTES + 1))]) await expect(processCommentImage(image)).rejects.toThrow();
  });
  it('rejects a tiny compressed file with excessive decode dimensions', async () => {
    const png = await sharp({ create: { width: 5000, height: 5000, channels: 3, background: 'black' } }).png().toBuffer();
    expect(png.length).toBeLessThan(COMMENT_IMAGE_MAX_BYTES);
    await expect(processCommentImage(file(png))).rejects.toThrow();
  });
  it('discards a trailing script payload when encoding an otherwise valid image', async () => {
    const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: 'red' } }).png().toBuffer();
    const result = await processCommentImage(file(Buffer.concat([png, Buffer.from('<script>payload-marker</script>')])));
    expect(result.data.includes(Buffer.from('payload-marker'))).toBe(false);
    expect((await sharp(result.data).metadata()).format).toBe('webp');
  });
});

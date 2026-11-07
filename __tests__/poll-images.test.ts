import { expect, it } from "bun:test";
import sharp from "sharp";
import { ASSET_POLICIES } from "@/lib/storage/policies";
const policy = ASSET_POLICIES["poll-image"];
it("decodes poll images, applies orientation, removes metadata and records transformed dimensions", async () => {
  const bytes = await sharp({
    create: { width: 4000, height: 1000, channels: 3, background: "#d97706" },
  })
    .withMetadata({ orientation: 6 })
    .jpeg()
    .toBuffer();
  const image = await policy.process(
    new File([new Uint8Array(bytes)], "cover.jpg", { type: "image/jpeg" }),
    { kind: "poll-image", userId: "admin" },
  );
  const metadata = await sharp(image.data).metadata();
  expect([image.width, image.height]).toEqual([400, 1600]);
  expect(metadata.exif).toBeUndefined();
  expect(metadata.format).toBe("webp");
  expect(image.key).toMatch(/^polls\/admin\/[a-f0-9-]+\.webp$/);
});
it("rejects disguised, truncated and oversized images before storage", async () => {
  const bytes = await sharp({
    create: { width: 3, height: 4, channels: 3, background: "#d97706" },
  })
    .png()
    .toBuffer();
  for (const file of [
    new File([new Uint8Array(bytes)], "fake.jpg", { type: "image/jpeg" }),
    new File([new Uint8Array(bytes.subarray(0, 30))], "broken.png", {
      type: "image/png",
    }),
    new File([new Uint8Array(3 * 1024 * 1024 + 1)], "large.png", {
      type: "image/png",
    }),
  ]) {
    await expect(
      policy.process(file, { kind: "poll-image", userId: "admin" }),
    ).rejects.toThrow();
  }
});

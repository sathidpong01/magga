import { describe, expect, it, beforeEach } from "vitest";
import {
  storeAsset,
  storeAssets,
  deleteAssets,
  MemoryStorageAdapter,
} from "../lib/storage";

// 1x1 transparent PNG
const SAMPLE_PNG_BUFFER = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082",
  "hex"
);

describe("Asset Storage Module", () => {
  let memoryAdapter: MemoryStorageAdapter;

  beforeEach(() => {
    memoryAdapter = new MemoryStorageAdapter("https://cdn.example.com");
  });

  describe("MemoryStorageAdapter", () => {
    it("puts, gets, and deletes objects in memory", async () => {
      await memoryAdapter.put("test/file.png", SAMPLE_PNG_BUFFER, "image/png");
      expect(memoryAdapter.has("test/file.png")).toBe(true);
      expect(memoryAdapter.getPublicUrl("test/file.png")).toBe(
        "https://cdn.example.com/test/file.png"
      );
      expect(memoryAdapter.getPublicHostname()).toBe("cdn.example.com");

      const deleted = await memoryAdapter.delete(["test/file.png"]);
      expect(deleted).toBe(1);
      expect(memoryAdapter.has("test/file.png")).toBe(false);
    });
  });

  describe("storeAsset", () => {
    it("stores manga-page asset without server-side transcoding", async () => {
      const file = new File([SAMPLE_PNG_BUFFER], "page-1.png", {
        type: "image/png",
      });

      const asset = await storeAsset(
        file,
        { kind: "manga-page", mangaId: "manga-123" },
        memoryAdapter
      );

      expect(asset.url).toContain("https://cdn.example.com/uploads/");
      expect(asset.key).toContain("uploads/");
      expect(asset.key).toContain("manga-123");
      expect(asset.contentType).toBe("image/png");
      expect(memoryAdapter.has(asset.key)).toBe(true);
    });

    it("stores and converts comment-image to webp", async () => {
      const file = new File([SAMPLE_PNG_BUFFER], "comment.png", {
        type: "image/png",
      });

      const asset = await storeAsset(
        file,
        { kind: "comment-image", userId: "user-456" },
        memoryAdapter
      );

      expect(asset.url).toContain("https://cdn.example.com/uploads/comments/");
      expect(asset.key).toContain("user-456");
      expect(asset.key).toMatch(/\.webp$/);
      expect(asset.contentType).toBe("image/webp");
      expect(memoryAdapter.has(asset.key)).toBe(true);
    });

    it("stores and crops avatar to 200x200 webp", async () => {
      const file = new File([SAMPLE_PNG_BUFFER], "avatar.png", {
        type: "image/png",
      });

      const asset = await storeAsset(
        file,
        { kind: "avatar", userId: "user-789" },
        memoryAdapter
      );

      expect(asset.url).toContain("https://cdn.example.com/uploads/avatars/user-789/");
      expect(asset.key).toMatch(/avatar\.webp$/);
      expect(asset.contentType).toBe("image/webp");
      expect(asset.width).toBe(200);
      expect(asset.height).toBe(200);
      expect(memoryAdapter.has(asset.key)).toBe(true);
    });

    it("stores advertisement image as webp", async () => {
      const file = new File([SAMPLE_PNG_BUFFER], "banner.png", {
        type: "image/png",
      });

      const asset = await storeAsset(
        file,
        { kind: "advertisement" },
        memoryAdapter
      );

      expect(asset.url).toContain("https://cdn.example.com/ads/");
      expect(asset.key).toMatch(/\.webp$/);
      expect(asset.contentType).toBe("image/webp");
      expect(memoryAdapter.has(asset.key)).toBe(true);
    });

    it("rejects files exceeding kind maxBytes limit", async () => {
      // 4MB + 1 byte
      const oversizedBuffer = Buffer.alloc(4 * 1024 * 1024 + 1);
      // Put PNG magic bytes
      SAMPLE_PNG_BUFFER.copy(oversizedBuffer, 0, 0, 8);

      const file = new File([oversizedBuffer], "huge.png", {
        type: "image/png",
      });

      await expect(
        storeAsset(
          file,
          { kind: "manga-page", mangaId: "manga-1" },
          memoryAdapter
        )
      ).rejects.toThrow(/too large/i);
    });

    it("rejects disallowed MIME types", async () => {
      const file = new File([Buffer.from("text file")], "notes.txt", {
        type: "text/plain",
      });

      await expect(
        storeAsset(
          file,
          { kind: "manga-page", mangaId: "manga-1" },
          memoryAdapter
        )
      ).rejects.toThrow(/not allowed/i);
    });
  });

  describe("storeAssets", () => {
    it("stores batch of files sequentially", async () => {
      const files = [
        new File([SAMPLE_PNG_BUFFER], "page-1.png", { type: "image/png" }),
        new File([SAMPLE_PNG_BUFFER], "page-2.png", { type: "image/png" }),
      ];

      const assets = await storeAssets(
        files,
        { kind: "manga-page", mangaId: "manga-batch" },
        memoryAdapter
      );

      expect(assets).toHaveLength(2);
      expect(memoryAdapter.size).toBe(2);
    });
  });

  describe("deleteAssets", () => {
    it("deletes by raw key and by full public url", async () => {
      await memoryAdapter.put("uploads/page1.png", SAMPLE_PNG_BUFFER, "image/png");
      await memoryAdapter.put("uploads/page2.png", SAMPLE_PNG_BUFFER, "image/png");

      const deletedCount = await deleteAssets(
        [
          "uploads/page1.png",
          "https://cdn.example.com/uploads/page2.png",
        ],
        memoryAdapter
      );

      expect(deletedCount).toBe(2);
      expect(memoryAdapter.size).toBe(0);
    });
  });
});

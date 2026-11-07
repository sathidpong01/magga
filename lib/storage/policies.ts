import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { readValidatedImageFile, sanitizeObjectKeySegment } from "../image-security";
import { AssetKind, StoreAssetContext } from "./types";
import { MANGA_IMAGE_MAX_BYTES, MANGA_IMAGE_TYPES } from "../manga-upload-policy";

export interface ProcessedAsset {
  data: Uint8Array;
  contentType: string;
  key: string;
  width?: number;
  height?: number;
}

export interface AssetPolicy {
  maxBytes: number;
  allowedMimeTypes: readonly string[];
  process(file: File, context: StoreAssetContext): Promise<ProcessedAsset>;
}

function getDateSegments() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return { year, month };
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, "_");
}

export const ASSET_POLICIES: Record<AssetKind, AssetPolicy> = {
  "poll-image": {
    maxBytes: 3 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    async process(file, context) {
      if (context.kind !== "poll-image") throw new Error("Invalid poll image context");
      const { buffer } = await readValidatedImageFile(file, { maxBytes: this.maxBytes, allowedMimeTypes: this.allowedMimeTypes });
      const { data, info } = await sharp(buffer, { limitInputPixels: 20_000_000, failOn: "warning" }).timeout({ seconds: 10 })
        .rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer({ resolveWithObject: true });
      return { data: new Uint8Array(data), contentType: "image/webp", key: `polls/${sanitizeObjectKeySegment(context.userId, "admin")}/${randomUUID()}.webp`, width: info.width, height: info.height };
    },
  },
  "manga-page": {
    maxBytes: MANGA_IMAGE_MAX_BYTES,
    allowedMimeTypes: MANGA_IMAGE_TYPES,
    async process(file: File, context: StoreAssetContext): Promise<ProcessedAsset> {
      if (context.kind !== "manga-page") {
        throw new Error("Invalid context for manga-page policy");
      }

      const { buffer } = await readValidatedImageFile(file, {
        maxBytes: ASSET_POLICIES["manga-page"].maxBytes,
        allowedMimeTypes: ASSET_POLICIES["manga-page"].allowedMimeTypes,
      });
      // Decode without transcoding; a matching header alone can still be a broken image.
      const image = sharp(buffer, { animated: true, limitInputPixels: 40_000_000, failOn: "warning" });
      const metadata = await image.metadata();
      if (!metadata.width || !metadata.height || metadata.width * (metadata.pageHeight || metadata.height) * (metadata.pages || 1) > 40_000_000)
        throw new Error("Image dimensions exceed the supported limit");
      await image.stats();

      const { year, month } = getDateSegments();
      const mangaId = sanitizeObjectKeySegment(context.mangaId, "uncategorized");
      const safeName = `${randomUUID()}-${sanitizeFileName(file.name)}`;
      const key = `uploads/${year}/${month}/${mangaId}/${safeName}`;

      return {
        data: new Uint8Array(buffer),
        contentType: file.type,
        key,
        width: metadata.width,
        height: metadata.pageHeight || metadata.height,
      };
    },
  },

  "comment-image": {
    maxBytes: 3 * 1024 * 1024, // 3 MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ],
    async process(file: File, context: StoreAssetContext): Promise<ProcessedAsset> {
      if (context.kind !== "comment-image") {
        throw new Error("Invalid context for comment-image policy");
      }

      const { buffer } = await readValidatedImageFile(file, {
        maxBytes: ASSET_POLICIES["comment-image"].maxBytes,
        allowedMimeTypes: ASSET_POLICIES["comment-image"].allowedMimeTypes,
      });

      const sharpInstance = sharp(buffer, { limitInputPixels: 32_000_000 }).timeout({ seconds: 10 });
      const metadata = await sharpInstance.metadata();

      if (metadata.width && metadata.width > 1280) {
        sharpInstance.resize(1280, null, { fit: "inside", withoutEnlargement: true });
      }

      const compressedBuffer = await sharpInstance
        .webp({ quality: 75 })
        .toBuffer();

      const { year, month } = getDateSegments();
      const userId = sanitizeObjectKeySegment(context.userId, "anonymous");
      const safeBaseName = sanitizeFileName(file.name.replace(/\.[^/.]+$/, ""));
      const key = `uploads/comments/${year}/${month}/${userId}/${randomUUID()}-${safeBaseName}.webp`;

      return {
        data: new Uint8Array(compressedBuffer),
        contentType: "image/webp",
        key,
        width: metadata.width ? Math.min(metadata.width, 1280) : undefined,
        height: metadata.height,
      };
    },
  },

  avatar: {
    maxBytes: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/heic",
      "image/heif",
    ],
    async process(file: File, context: StoreAssetContext): Promise<ProcessedAsset> {
      if (context.kind !== "avatar") {
        throw new Error("Invalid context for avatar policy");
      }

      const { buffer } = await readValidatedImageFile(file, {
        maxBytes: ASSET_POLICIES.avatar.maxBytes,
        allowedMimeTypes: ASSET_POLICIES.avatar.allowedMimeTypes,
      });

      const processedBuffer = await sharp(buffer, { limitInputPixels: 32_000_000 }).timeout({ seconds: 10 })
        .resize(200, 200, { fit: "cover", position: "centre" })
        .webp({ quality: 85 })
        .toBuffer();

      const userId = sanitizeObjectKeySegment(context.userId, "unknown");
      const key = `uploads/avatars/${userId}/${randomUUID()}-avatar.webp`;

      return {
        data: new Uint8Array(processedBuffer),
        contentType: "image/webp",
        key,
        width: 200,
        height: 200,
      };
    },
  },

  advertisement: {
    maxBytes: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ],
    async process(file: File, context: StoreAssetContext): Promise<ProcessedAsset> {
      if (context.kind !== "advertisement") {
        throw new Error("Invalid context for advertisement policy");
      }

      const { buffer } = await readValidatedImageFile(file, {
        maxBytes: ASSET_POLICIES.advertisement.maxBytes,
        allowedMimeTypes: ASSET_POLICIES.advertisement.allowedMimeTypes,
      });

      const processedBuffer = await sharp(buffer, { limitInputPixels: 32_000_000 }).timeout({ seconds: 10 })
        .resize(1200, 800, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

      const key = `ads/${randomUUID()}.webp`;

      return {
        data: new Uint8Array(processedBuffer),
        contentType: "image/webp",
        key,
      };
    },
  },
};

import { S3Client, PutObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { StorageAdapter } from "../types";

const DEFAULT_R2_PUBLIC_URL = "https://pub-1f8d25d164134702943300ef6d01fc35.r2.dev";

export class R2StorageAdapter implements StorageAdapter {
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor(config?: {
    accountId?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    bucket?: string;
    publicUrl?: string;
  }) {
    const accountId = config?.accountId ?? process.env.R2_ACCOUNT_ID ?? "";
    const accessKeyId = config?.accessKeyId ?? process.env.R2_ACCESS_KEY_ID ?? "";
    const secretAccessKey = config?.secretAccessKey ?? process.env.R2_SECRET_ACCESS_KEY ?? "";

    this.bucket = config?.bucket ?? process.env.R2_BUCKET_NAME ?? "";
    this.publicUrl = config?.publicUrl ?? process.env.R2_PUBLIC_URL ?? DEFAULT_R2_PUBLIC_URL;

    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async put(
    key: string,
    body: Buffer | Uint8Array,
    contentType: string,
    options?: { cacheControl?: string }
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: options?.cacheControl ?? "public, max-age=31536000, immutable",
      })
    );
  }

  async delete(keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;

    let totalDeleted = 0;
    const chunkSize = 1000;

    for (let i = 0; i < keys.length; i += chunkSize) {
      const chunk = keys.slice(i, i + chunkSize);
      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: {
            Objects: chunk.map((Key) => ({ Key })),
          },
        })
      );
      totalDeleted += chunk.length;
    }

    return totalDeleted;
  }

  getPublicUrl(key: string): string {
    const cleanBase = this.publicUrl.replace(/\/+$/, "");
    const cleanKey = key.replace(/^\/+/, "");
    return `${cleanBase}/${cleanKey}`;
  }

  getPublicHostname(): string {
    try {
      return new URL(this.publicUrl).hostname;
    } catch {
      return new URL(DEFAULT_R2_PUBLIC_URL).hostname;
    }
  }
}

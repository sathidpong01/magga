import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { CommentError } from "@/lib/comments/types";
import { COMMENT_IMAGE_MAX_BYTES } from "@/lib/comments/image-processing";

export interface CommentPrivateStorage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  delete(key: string): Promise<void>;
  publish(key: string): Promise<string>;
  unpublish(key: string): Promise<void>;
  discardStaging(key: string): Promise<void>;
  previewUrl(key: string): Promise<string>;
  publicUrl(key: string): string;
}

function validateKey(key: string) {
  if (!/^comments\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$/.test(key)) {
    throw new CommentError("รูปความคิดเห็นไม่ถูกต้อง", 400, "VALIDATION_ERROR");
  }
}

function unavailable(): never {
  throw new CommentError("ระบบอัปโหลดรูปยังไม่พร้อม กรุณาส่งข้อความก่อนได้", 503, "UPLOAD_UNAVAILABLE");
}

/** The staging bucket must have r2.dev and custom public domains disabled. */
export function getCommentPrivateStorage(): CommentPrivateStorage {
  const bucket = process.env.R2_COMMENT_BUCKET_NAME;
  const publicBucket = process.env.R2_COMMENT_PUBLIC_BUCKET_NAME;
  const configuredUrl = process.env.R2_COMMENT_PUBLIC_URL;
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_COMMENT_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_COMMENT_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
  if (!bucket || !publicBucket || !configuredUrl || bucket === publicBucket || bucket === process.env.R2_BUCKET_NAME || publicBucket === process.env.R2_BUCKET_NAME || !accountId || !accessKeyId || !secretAccessKey) unavailable();
  let publicOrigin: string;
  try {
    const url = new URL(configuredUrl);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash || url.pathname !== "/" || url.hostname === "localhost" || url.hostname.endsWith(".r2.cloudflarestorage.com")) unavailable();
    // Only a canonical origin is accepted; paths, escaped delimiters and whitespace fail closed.
    if (configuredUrl !== url.origin && configuredUrl !== `${url.origin}/`) unavailable();
    publicOrigin = url.origin;
  } catch { unavailable(); }
  const publicUrl = (key: string) => { validateKey(key); return `${publicOrigin}/${key}`; };
  const client = new S3Client({ region: "auto", endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey }, maxAttempts: 2 });
  return {
    async put(key, body, contentType) {
      validateKey(key);
      if (contentType !== "image/webp" || !body.length || body.length > COMMENT_IMAGE_MAX_BYTES) throw new CommentError("รูปความคิดเห็นไม่ถูกต้อง", 400, "VALIDATION_ERROR");
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType, CacheControl: "private, no-store" }));
    },
    async get(key) {
      validateKey(key);
      try {
        const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        if (!response.Body || !response.ContentLength || response.ContentLength > COMMENT_IMAGE_MAX_BYTES) throw new Error("Invalid comment object");
        const bytes = await response.Body.transformToByteArray();
        if (bytes.length > COMMENT_IMAGE_MAX_BYTES) throw new Error("Invalid comment object size");
        return bytes;
      } catch (error) { if (error instanceof Error && error.name === "NoSuchKey") return null; throw error; }
    },
    publicUrl,
    async previewUrl(key) {
      validateKey(key);
      return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key, ResponseCacheControl: "private, no-store" }), { expiresIn: 60 });
    },
    async publish(key) {
      const url = publicUrl(key);
      await client.send(new CopyObjectCommand({ Bucket: publicBucket, Key: key, CopySource: `${bucket}/${key}`, MetadataDirective: "REPLACE", ContentType: "image/webp", CacheControl: "no-store, max-age=0" }));
      return url;
    },
    async unpublish(key) {
      validateKey(key);
      await client.send(new DeleteObjectCommand({ Bucket: publicBucket, Key: key }));
    },
    async discardStaging(key) {
      validateKey(key);
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
    async delete(key) {
      validateKey(key);
      // Attempt both removals even when one fails, then preserve the original failure for retry.
      const results = await Promise.allSettled([publicBucket, bucket].map(target => client.send(new DeleteObjectCommand({ Bucket: target, Key: key }))));
      for (const result of results) if (result.status === "rejected") throw result.reason;
    },
  };
}

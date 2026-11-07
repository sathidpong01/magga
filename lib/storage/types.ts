export type AssetKind =
  | "manga-page"
  | "comment-image"
  | "avatar"
  | "advertisement"
  | "poll-image";
// Poll images use the same storage seam with a dedicated validation policy.

export type StoreAssetContext =
  | { kind: "manga-page"; mangaId: string }
  | { kind: "comment-image"; userId: string }
  | { kind: "avatar"; userId: string }
  | { kind: "advertisement" }
  | { kind: "poll-image"; userId: string };

export interface StoredAsset {
  url: string;
  key: string;
  contentType: string;
  size: number;
  width?: number;
  height?: number;
}

export interface StorageAdapter {
  put(
    key: string,
    body: Buffer | Uint8Array,
    contentType: string,
    options?: { cacheControl?: string }
  ): Promise<void>;

  delete(keys: string[]): Promise<number>;

  getPublicUrl(key: string): string;

  getPublicHostname(): string;
}

import { ASSET_POLICIES } from "./policies";
import { R2StorageAdapter } from "./adapters/r2";
import { MemoryStorageAdapter } from "./adapters/memory";
import {
  AssetKind,
  StorageAdapter,
  StoreAssetContext,
  StoredAsset,
} from "./types";

export * from "./types";
export { R2StorageAdapter, MemoryStorageAdapter };

let defaultStorageAdapter: StorageAdapter | null = null;

export function getDefaultStorageAdapter(): StorageAdapter {
  if (!defaultStorageAdapter) {
    defaultStorageAdapter = new R2StorageAdapter();
  }
  return defaultStorageAdapter;
}

export function setDefaultStorageAdapter(adapter: StorageAdapter | null): void {
  defaultStorageAdapter = adapter;
}

export async function storeAsset(
  file: File,
  context: StoreAssetContext,
  adapter: StorageAdapter = getDefaultStorageAdapter()
): Promise<StoredAsset> {
  const policy = ASSET_POLICIES[context.kind];
  if (!policy) {
    throw new Error(`Unsupported asset kind: ${context.kind}`);
  }

  const processed = await policy.process(file, context);

  await adapter.put(processed.key, processed.data, processed.contentType);

  return {
    url: adapter.getPublicUrl(processed.key),
    key: processed.key,
    contentType: processed.contentType,
    size: processed.data.byteLength,
    width: processed.width,
    height: processed.height,
  };
}

export async function storeAssets(
  files: File[],
  context: StoreAssetContext,
  adapter: StorageAdapter = getDefaultStorageAdapter()
): Promise<StoredAsset[]> {
  const results: StoredAsset[] = [];

  try {
    for (const file of files) {
      const stored = await storeAsset(file, context, adapter);
      results.push(stored);
    }
  } catch (error) {
    // These UUID keys were created in this operation and were never returned.
    // Cleanup never takes its authority from caller-supplied URLs.
    if (results.length) {
      try { await adapter.delete(results.map(asset => asset.key)); }
      catch { throw new Error("Upload failed; storage rollback requires retry"); }
    }
    throw error;
  }

  return results;
}

export async function deleteAssets(
  keysOrUrls: string[],
  adapter: StorageAdapter = getDefaultStorageAdapter()
): Promise<number> {
  if (keysOrUrls.length === 0) return 0;

  const publicUrl = adapter.getPublicUrl("");
  const publicBase = publicUrl.replace(/\/+$/, "");

  const keys = keysOrUrls.map(item => storageObjectKey(item, publicBase));

  return adapter.delete(keys);
}

export function storageObjectKey(item: string, publicBase: string): string {
  let key = item;
  if (/^https?:\/\//i.test(item)) {
    const base = new URL(`${publicBase.replace(/\/+$/, "")}/`);
    const target = new URL(item);
    if (target.origin !== base.origin || !target.pathname.startsWith(base.pathname) || target.search || target.hash) throw new Error("Invalid storage URL");
    key = target.pathname.slice(base.pathname.length);
  }
  key = key.replace(/^\/+/, "");
  if (!key || key.includes("..") || key.includes("\\") || key.includes(":") || /%2f|%2e|%5c/i.test(key)) throw new Error("Invalid storage key");
  return key;
}

export function getStoragePublicUrl(
  key: string,
  adapter: StorageAdapter = getDefaultStorageAdapter()
): string {
  return adapter.getPublicUrl(key);
}

export function getStoragePublicHostname(
  adapter: StorageAdapter = getDefaultStorageAdapter()
): string {
  return adapter.getPublicHostname();
}

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

  for (const file of files) {
    const stored = await storeAsset(file, context, adapter);
    results.push(stored);
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

  const keys = keysOrUrls.map((item) => {
    let key = item;
    if (key.startsWith(publicBase)) {
      key = key.slice(publicBase.length);
    }
    return key.replace(/^\/+/, "");
  });

  return adapter.delete(keys);
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

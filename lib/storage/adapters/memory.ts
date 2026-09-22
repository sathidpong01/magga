import { StorageAdapter } from "../types";

export interface StoredMemoryObject {
  body: Buffer | Uint8Array;
  contentType: string;
  cacheControl?: string;
}

export class MemoryStorageAdapter implements StorageAdapter {
  private store = new Map<string, StoredMemoryObject>();
  private baseUrl: string;

  constructor(baseUrl = "https://memory.test") {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  async put(
    key: string,
    body: Buffer | Uint8Array,
    contentType: string,
    options?: { cacheControl?: string }
  ): Promise<void> {
    this.store.set(key, {
      body,
      contentType,
      cacheControl: options?.cacheControl,
    });
  }

  async delete(keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (this.store.delete(key)) {
        deleted++;
      }
    }
    return deleted;
  }

  getPublicUrl(key: string): string {
    const cleanKey = key.replace(/^\/+/, "");
    return `${this.baseUrl}/${cleanKey}`;
  }

  getPublicHostname(): string {
    try {
      return new URL(this.baseUrl).hostname;
    } catch {
      return "memory.test";
    }
  }

  // Test inspection utilities
  has(key: string): boolean {
    return this.store.has(key);
  }

  get(key: string): StoredMemoryObject | undefined {
    return this.store.get(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

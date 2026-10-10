import { describe, expect, it } from "bun:test";
import { MemoryStorageAdapter, storageObjectKey, storeAsset, storeAssets } from "../lib/storage";
const png = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082", "hex");
const file = () => new File([png], "same.png", { type: "image/png" });
describe("owned storage operations", () => {
  it("gives simultaneous assets distinct keys", async () => {
    const adapter = new MemoryStorageAdapter("https://cdn.example.org/assets");
    const assets = await Promise.all(Array.from({ length: 8 }, () => storeAsset(file(), { kind: "manga-page", mangaId: "fixture" }, adapter)));
    expect(new Set(assets.map(asset => asset.key)).size).toBe(8);
  });
  it("rolls back only keys produced by a failed batch", async () => {
    const adapter = new MemoryStorageAdapter("https://cdn.example.org");
    await adapter.put("published/keep.png", png, "image/png");
    const originalPut = adapter.put.bind(adapter); let writes = 0; const retired: string[][] = [];
    adapter.put = async (key, body, type) => { if (++writes === 2) throw new Error("fixture storage failure"); await originalPut(key, body, type); };
    const originalDelete = adapter.delete.bind(adapter);
    adapter.delete = async keys => { retired.push(keys); return originalDelete(keys); };
    await expect(storeAssets([file(), file()], { kind: "manga-page", mangaId: "fixture" }, adapter)).rejects.toThrow("fixture storage failure");
    expect(retired).toHaveLength(1); expect(retired[0]).toHaveLength(1);
    expect(adapter.has(retired[0][0])).toBe(false);
    expect(adapter.has("published/keep.png")).toBe(true);
  });
  it("rejects other hosts, base-prefix lookalikes, traversal and query URLs", () => {
    for (const target of ["https://elsewhere.example/assets/a.png", "https://cdn.example.org/assets-other/a.png", "https://cdn.example.org/assets/a.png?x=1", "../keep.png", "uploads/%2e%2e/keep.png", "uploads/..\\keep.png"]) expect(() => storageObjectKey(target, "https://cdn.example.org/assets")).toThrow();
    expect(storageObjectKey("https://cdn.example.org/assets/uploads/a.png", "https://cdn.example.org/assets")).toBe("uploads/a.png");
  });
});

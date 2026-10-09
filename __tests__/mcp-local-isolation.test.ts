import { describe, expect, it } from "bun:test";
import { fileURLToPath } from "node:url";

function loadDatabase(url: string, local = true) {
  // Each import needs a fresh module registry because db reads its environment at module load.
  const result = Bun.spawnSync([process.execPath, fileURLToPath(new URL("./helpers/db-connection.ts", import.meta.url))], {
    env: { ...process.env, VERCEL: "", NEXT_PHASE: "", MAGGA_DISPOSABLE_DATABASE: "", POSTGRES_URL: "", POSTGRES_PRISMA_URL: "", POSTGRES_URL_NON_POOLING: "", MCP_LOCAL_DATABASE: String(local), DATABASE_URL: url },
  });
  expect(result.exitCode).toBe(0);
  return JSON.parse(result.stdout.toString()) as { error: string; calls: [string, { max: number }][] };
}

describe("isolated database connection guard", () => {
  it.each([
    "postgresql://postgres:example@db.example.org:5432/postgres",
    "postgresql://postgres:example@127.0.0.1:5432/postgres",
    "postgresql://postgres:example@127.0.0.1:55432/production",
    "postgresql://postgres:example@localhost:55432/postgres",
  ])("rejects unexpected destination before opening a client: %s", (url) => {
    const result = loadDatabase(url);
    expect(result.error).toContain("isolated loopback endpoint");
    expect(result.calls).toEqual([]);
  });
  it("accepts only the dedicated loopback endpoint in local mode", () => {
    const url = "postgresql://postgres:example@127.0.0.1:55432/postgres";
    const result = loadDatabase(url);
    expect(result.error).toContain("connection factory reached");
    expect(result.calls).toEqual([[url, expect.objectContaining({ max: 1 })]]);
  });
  it("preserves ordinary database selection when local mode is disabled", () => {
    const result = loadDatabase("postgresql://postgres:example@db.example.org:5432/postgres", false);
    expect(result.error).toContain("connection factory reached");
    expect(result.calls).toHaveLength(1);
  });
});

import { describe, expect, it } from "bun:test";
import { fileURLToPath } from "node:url";

function loadDatabase(url: string, disposable = true, localMcp = false) {
  // Separate processes ensure every case runs the module's pre-connect guard.
  const result = Bun.spawnSync([process.execPath, "--no-env-file", fileURLToPath(new URL("./helpers/db-connection.ts", import.meta.url))], {
    env: {
      ...process.env, DATABASE_URL: url, MAGGA_DISPOSABLE_DATABASE: String(disposable),
      MCP_LOCAL_DATABASE: String(localMcp), VERCEL: "", NEXT_PHASE: "",
      POSTGRES_URL: "", POSTGRES_PRISMA_URL: "", POSTGRES_URL_NON_POOLING: "",
    },
  });
  expect(result.exitCode).toBe(0);
  return JSON.parse(result.stdout.toString()) as { error: string; calls: [string, { max: number }][] };
}

describe("disposable browser database isolation", () => {
  it.each([
    "postgresql://postgres:postgres@db.example.org:55433/postgres",
    "postgresql://postgres:postgres@localhost:55433/postgres",
    "postgresql://postgres:postgres@127.0.0.1:55432/postgres",
    "postgresql://postgres:postgres@127.0.0.1:5432/magga_ci",
    "postgresql://postgres:postgres@127.0.0.1:55433/production",
    "mysql://postgres:postgres@127.0.0.1:55433/postgres",
    "postgresql://other:postgres@127.0.0.1:55433/postgres",
    "postgresql://postgres:other@127.0.0.1:55433/postgres",
    "postgresql://postgres@127.0.0.1:55433/postgres",
    "postgresql://postgres:postgres@127.0.0.1:55433/postgres?sslmode=require",
    "postgresql://postgres:postgres@127.0.0.1:55433/postgres?",
    "postgresql://postgres:postgres@127.0.0.1:55433/postgres#fragment",
    "postgresql://postgres:postgres@127.0.0.1:55433/postgres#",
  ])("rejects a non-fixture destination before connecting: %s", url => {
    const result = loadDatabase(url);
    expect(result.error).toContain("Disposable database mode requires");
    expect(result.calls).toEqual([]);
  });

  it.each(["postgresql", "postgres"])("serializes the valid %s fixture without setting a build phase", protocol => {
    const url = `${protocol}://postgres:postgres@127.0.0.1:55433/postgres`;
    const result = loadDatabase(url);
    expect(result.error).toContain("connection factory reached");
    expect(result.calls).toEqual([[url, expect.objectContaining({ max: 1 })]]);
  });

  it("keeps the ordinary local pool when disposable mode is disabled", () => {
    const url = "postgresql://postgres:postgres@127.0.0.1:55433/postgres";
    const result = loadDatabase(url, false);
    expect(result.calls).toEqual([[url, expect.objectContaining({ max: 10 })]]);
  });

  it("does not bypass the existing MCP destination guard", () => {
    const result = loadDatabase("postgresql://postgres:postgres@127.0.0.1:55433/postgres", true, true);
    expect(result.error).toContain("Local MCP database mode requires");
    expect(result.calls).toEqual([]);
  });
});

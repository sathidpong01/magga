import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ execute: vi.fn(), deleted: vi.fn() }));
vi.mock("@/db", () => ({ db: {
  execute: mocks.execute,
  delete: () => ({ where: () => ({ returning: mocks.deleted }) }),
  select: () => ({ from: () => ({ where: async () => [] }) }),
} }));
vi.mock("@/lib/storage", () => ({ deleteAssets: vi.fn() }));
import { GET } from "@/app/api/cron/cleanup/route";

describe("advertisement event retention", () => {
  beforeEach(() => {
    mocks.execute.mockReset();
    mocks.execute.mockResolvedValue([{ count: 4 }]);
    mocks.deleted.mockResolvedValue([]);
  });
  afterEach(() => { vi.unstubAllEnvs(); });
  it("rejects cleanup when no secret has been configured", async () => {
    vi.stubEnv("CRON_SECRET", undefined);
    expect((await GET(new Request("http://localhost/api/cron/cleanup"))).status).toBe(401);
    expect(mocks.execute).not.toHaveBeenCalled();
  });
  it("cleans event identifiers with the authenticated daily cleanup", async () => {
    vi.stubEnv("CRON_SECRET", "local-test-secret");
    const response = await GET(new Request("http://localhost/api/cron/cleanup", { headers: { authorization: "Bearer local-test-secret" } }));
    expect(response.status).toBe(200);
    expect((await response.json()).adEventsDeleted).toBe(4);
  });
});

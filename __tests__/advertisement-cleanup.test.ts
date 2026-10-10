import { beforeEach, afterEach, describe, expect, it, jest, mock } from "bun:test";

const mocks = { execute: jest.fn(), deleted: jest.fn(), select: jest.fn(), storageDelete: jest.fn() };
mock.module("@/db", () => ({ db: {
  execute: mocks.execute,
  delete: () => ({ where: () => ({ returning: mocks.deleted }) }),
  select: () => ({ from: () => ({ where: mocks.select }) }),
} }));
mock.module("@/lib/storage", () => ({ deleteAssets: mocks.storageDelete }));
const { GET } = await import("@/app/api/cron/cleanup/route");

const originalSecret = process.env.CRON_SECRET;

describe("advertisement event retention", () => {
  beforeEach(() => {
    mocks.execute.mockReset();
    mocks.execute.mockResolvedValue([{ count: 4 }]);
    mocks.deleted.mockResolvedValue([]);
    mocks.select.mockResolvedValue([{ count: 7 }]);
    mocks.storageDelete.mockReset();
  });
  afterEach(() => { if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret; });
  it("rejects cleanup when no secret has been configured", async () => {
    delete process.env.CRON_SECRET;
    expect((await GET(new Request("http://localhost/api/cron/cleanup"))).status).toBe(401);
    expect(mocks.execute).not.toHaveBeenCalled();
  });
  it("cleans event identifiers with the authenticated daily cleanup", async () => {
    process.env.CRON_SECRET = "local-test-secret";
    const response = await GET(new Request("http://localhost/api/cron/cleanup", { headers: { authorization: "Bearer local-test-secret" } }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.adEventsDeleted).toBe(4);
    expect(body.submissionsDeferred).toBe(7);
    expect(body.submissionsDeleted).toBe(0);
    expect(body.r2FilesDeleted).toBe(0);
    expect(mocks.storageDelete).not.toHaveBeenCalled();

  });
});

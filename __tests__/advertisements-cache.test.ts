import { beforeEach, describe, expect, it, jest, mock } from "bun:test";

const mocks = {
  active: false,
  cached: undefined as undefined | object[],
  revalidateTag: jest.fn(),
  getSession: jest.fn(),
  requireAdmin: jest.fn(),
};

mock.module("next/cache", () => ({
  unstable_cache: (read: () => Promise<object[]>) => async () => {
    if (mocks.cached === undefined) mocks.cached = await read();
    return mocks.cached;
  },
  revalidateTag: (...args: unknown[]) => {
    mocks.cached = undefined;
    mocks.revalidateTag(...args);
  },
}));

mock.module("@/db", () => ({
  db: {
    query: { advertisements: { findMany: async () => mocks.active ? [{ id: "ad-1", placement: "manga-end", isActive: true }] : [] } },
    update: () => ({ set: (data: { isActive: boolean }) => ({ where: () => ({ returning: async () => {
      mocks.active = data.isActive;
      return [{ id: "ad-1", ...data }];
    } }) }) }),
  },
}));
mock.module("@/db/schema", () => ({ advertisements: { isActive: "isActive", createdAt: "createdAt", id: "id" } }));
mock.module("drizzle-orm", () => ({ eq: jest.fn(), desc: jest.fn() }));
mock.module("@/lib/auth", () => ({ auth: { api: { getSession: mocks.getSession } } }));
mock.module("@/lib/auth-helpers", () => ({ requireAdmin: mocks.requireAdmin }));

const { GET } = await import("@/app/api/advertisements/route");
const { PATCH } = await import("@/app/api/advertisements/[id]/route");
import type { NextRequest } from "next/server";

describe("advertisement activation", () => {
  beforeEach(() => {
    mocks.active = false;
    mocks.cached = undefined;
    jest.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { role: "admin" } });
    mocks.requireAdmin.mockReturnValue(null);
  });

  it("makes a newly enabled manga-end ad visible to the public immediately", async () => {
    const publicRequest = new Request("http://localhost/api/advertisements?placement=manga-end") as NextRequest;
    expect(await (await GET(publicRequest)).json()).toEqual([]);

    const update = new Request("http://localhost/api/advertisements/ad-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: true }),
    }) as NextRequest;
    expect((await PATCH(update, { params: Promise.resolve({ id: "ad-1" }) })).status).toBe(200);

    expect(await (await GET(publicRequest)).json()).toEqual([
      { id: "ad-1", placement: "manga-end" },
    ]);
    expect(mocks.revalidateTag).toHaveBeenCalledWith("advertisements", { expire: 0 });
  });
});

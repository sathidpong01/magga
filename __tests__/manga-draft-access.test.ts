import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

const mocks = vi.hoisted(() => ({ session: vi.fn(), hidden: true }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mocks.session } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NEXT_NOT_FOUND"); } }));
vi.mock("@/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: (condition: Parameters<PgDialect["sqlToQuery"]>[0]) => ({
          limit: async () => {
            const query = new PgDialect().sqlToQuery(condition);
            if (!query.sql.includes('"manga"."slug"')) return [];
            if (mocks.hidden && query.sql.includes('"is_hidden"') && query.params.includes(false)) return [];
            return [{
              id: "draft-id", slug: "passing-love-1", title: "Draft title",
              isHidden: mocks.hidden, pages: [], coverImage: "/cover.png",
              authorId: null, categoryId: null, ratingCount: 0, viewCount: 0,
            }];
          },
          then: (resolve: (value: unknown[]) => void) => resolve([]),
        }),
        innerJoin: () => ({ where: () => ({
          orderBy: async () => [],
          then: (resolve: (value: unknown[]) => void) => resolve([]),
        }) }),
      }),
    }),
  },
}));

import MangaPage, { generateMetadata } from "@/app/[mangaId]/page";

const props = () => ({ params: Promise.resolve({ mangaId: "passing-love-1" }) });

describe("draft manga access", () => {
  beforeEach(() => {
    mocks.hidden = true;
    mocks.session.mockReset();
    mocks.session.mockResolvedValue(null);
  });

  it.each(["admin", "moderator"])("allows %s to preview a draft", async (role) => {
    mocks.session.mockResolvedValue({ user: { id: "staff", role } });
    await expect(MangaPage(props())).resolves.toBeTruthy();
    const metadata = await generateMetadata(props());
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.openGraph).toBeUndefined();
  });

  it.each([null, "user", "unknown"])("hides drafts from %s", async (role) => {
    mocks.session.mockResolvedValue(role ? { user: { id: "reader", role } } : null);
    await expect(MangaPage(props())).rejects.toThrow("NEXT_NOT_FOUND");
    expect((await generateMetadata(props())).title).toBe("Not Found");
  });

  it.each(["banned", "isBanned"])("rejects an admin with %s", async (flag) => {
    mocks.session.mockResolvedValue({ user: { id: "staff", role: "admin", [flag]: true } });
    await expect(MangaPage(props())).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("keeps published manga accessible without a session", async () => {
    mocks.hidden = false;
    await expect(MangaPage(props())).resolves.toBeTruthy();
    expect((await generateMetadata(props())).openGraph).toBeDefined();
  });
});

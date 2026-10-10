import { beforeEach, expect, it, jest, mock } from "bun:test";
const session = jest.fn();
const read = jest.fn(() => { throw new Error("PRIVATE_READ_BEFORE_AUTH"); });
mock.module("server-only", () => ({}));
mock.module("@/lib/auth", () => ({ auth: { api: { getSession: session } } }));
mock.module("@/db", () => ({ db: { select: read, query: { manga: { findFirst: read }, mangaSubmissions: { findMany: read }, categories: { findMany: read }, tags: { findMany: read }, authors: { findMany: read } } } }));
const navigation = await import("next/navigation");
mock.module("next/navigation", () => ({ ...navigation, redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
const Users = (await import("@/app/dashboard/admin/users/page")).default;
const Mangas = (await import("@/app/dashboard/admin/manga/page")).default;
const Submissions = (await import("@/app/dashboard/admin/submissions/page")).default;
const Edit = (await import("@/app/dashboard/admin/manga/[id]/edit/page")).default;
beforeEach(() => { session.mockReset(); read.mockClear(); });
it.each([null, { user: { id: "member", role: "user" } }, { user: { id: "staff", role: "admin", banned: false, isBanned: true } }])("guards nested pages before private data reads: %j", async actor => {
  session.mockResolvedValue(actor);
  for (const execute of [() => Users(), () => Mangas(), () => Submissions({ searchParams: Promise.resolve({}) }), () => Edit({ params: Promise.resolve({ id: "10000000-0000-4000-8000-000000000001" }) })]) {
    await expect(execute()).rejects.toThrow("REDIRECT:");
  }
  expect(read).not.toHaveBeenCalled();
  expect(session.mock.calls.every(([input]) => input.query.disableCookieCache)).toBe(true);
});

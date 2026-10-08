import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, jest, mock } from "bun:test";

mock.module("@/lib/auth-fetch", () => ({ authFetch: jest.fn() }));
mock.module("@/lib/auth-client", () => ({
  useSession: () => ({ data: null }),
}));
mock.module("@/app/components/features/comments/guest-client", () => ({
  commentRequest: jest.fn(),
  GuestVerification: () => null,
}));
mock.module("@/app/components/features/comments/CommentBox", () => ({
  default: () => null,
}));

import type { AdminComment } from "@/app/dashboard/admin/comments/CommentsManager";
const { default: CommentsManager } = await import("@/app/dashboard/admin/comments/CommentsManager");
import type { PublicComment } from "@/app/components/features/comments/CommentList";
const { default: CommentList } = await import("@/app/components/features/comments/CommentList");

const imageUrl = "https://media.example.test/comments/published.webp";
const adminComment: AdminComment = {
  id: "comment",
  content: "ความคิดเห็น",
  imageUrl,
  voteScore: 0,
  createdAt: "2026-10-07T00:00:00Z",
  status: "published",
  user: { id: "user", name: "ผู้อ่าน", username: "reader", image: null },
  manga: { id: "manga", title: "มังงะ", slug: "manga" },
  parent: null,
};
const publicComment: PublicComment = {
  ...adminComment,
  author: { kind: "member", name: "ผู้อ่าน" },
};
const renderAdmin = (status: string) =>
  renderToStaticMarkup(
    createElement(CommentsManager, {
      initialComments: [{ ...adminComment, status }],
      initialPagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    }),
  );

describe("comment publication and permanent deletion UI", () => {
  it("offers permanent deletion without hide or restore actions", () => {
    const html = renderAdmin("published");
    expect(html).toContain(">ลบถาวร</button>");
    expect(html).not.toContain(">ซ่อน</button>");
    expect(html).not.toContain("คืนสถานะ");
    expect(html).not.toContain(">เผยแพร่ข้อมูลเดิม</button>");
    expect(html).toContain("ความคิดเห็นใหม่เผยแพร่ทันที");
  });

  it.each(["pending", "hidden", "deleted"])(
    "has no publish or restore control for legacy %s rows",
    (status) => {
      const html = renderAdmin(status);
      expect(html).not.toContain(">เผยแพร่ข้อมูลเดิม</button>");
      expect(html).not.toContain("คืนสถานะ");
      expect(html).not.toContain(">ซ่อน</button>");
    },
  );

  it("renders public comment images at their direct URL and retains deletion placeholders", () => {
    const renderPublic = (comments: PublicComment[]) =>
      renderToStaticMarkup(
        createElement(CommentList, {
          comments,
          mangaId: "manga",
          onRefresh: jest.fn(),
        }),
      );
    const html = renderPublic([publicComment]);
    const image = html.match(/<img\b[^>]*>/)?.[0];
    expect(image).toContain(`src="${imageUrl}"`);
    expect(image).toContain('loading="lazy"');
    expect(html).not.toContain("/_next/image");
    expect(html).not.toContain("/api/comments/media/");
    const deleted = renderPublic([
      { ...publicComment, status: "deleted", content: "", imageUrl: null },
    ]);
    expect(deleted).toContain("ความคิดเห็นนี้ถูกลบแล้ว");
    expect(deleted).not.toContain(imageUrl);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  checkRateLimit: vi.fn(),
  dbSelect: vi.fn(),
  dbInsert: vi.fn(),
  dbUpdate: vi.fn(),
  dbDelete: vi.fn(),
  dbFindMany: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/db", () => ({
  db: {
    select: mocks.dbSelect,
    insert: mocks.dbInsert,
    update: mocks.dbUpdate,
    delete: mocks.dbDelete,
    query: {
      comments: {
        findMany: mocks.dbFindMany,
      },
    },
  },
}));

import {
  CommentError,
  UnauthorizedCommentError,
  ForbiddenCommentError,
  NotFoundCommentError,
  RateLimitCommentError,
  ValidationCommentError,
  handleCommentError,
  parseCommentCursor,
  getNextCommentCursor,
  createComment,
  updateComment,
  deleteComment,
  voteComment,
  listComments,
} from "@/lib/comments";
import type { CallerContext } from "@/lib/auth-helpers";

describe("Comments Module (lib/comments)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
  });

  describe("Domain Errors", () => {
    it("instantiates domain error classes with correct defaults", () => {
      const baseErr = new CommentError("error", 500, "CUSTOM");
      expect(baseErr.status).toBe(500);
      expect(baseErr.code).toBe("CUSTOM");

      const unauthErr = new UnauthorizedCommentError();
      expect(unauthErr.status).toBe(401);
      expect(unauthErr.code).toBe("UNAUTHORIZED");

      const forbiddenErr = new ForbiddenCommentError();
      expect(forbiddenErr.status).toBe(403);
      expect(forbiddenErr.code).toBe("FORBIDDEN");

      const notFoundErr = new NotFoundCommentError();
      expect(notFoundErr.status).toBe(404);
      expect(notFoundErr.code).toBe("NOT_FOUND");

      const rateLimitErr = new RateLimitCommentError("Too fast", 123456789, 5);
      expect(rateLimitErr.status).toBe(429);
      expect(rateLimitErr.code).toBe("RATE_LIMITED");
      expect(rateLimitErr.resetTime).toBe(123456789);
      expect(rateLimitErr.waitMinutes).toBe(5);

      const valErr = new ValidationCommentError("Invalid input");
      expect(valErr.status).toBe(400);
      expect(valErr.code).toBe("VALIDATION_ERROR");
    });

    it("handleCommentError translates domain errors to NextResponse", async () => {
      const res401 = handleCommentError(new UnauthorizedCommentError("Login first"));
      expect(res401.status).toBe(401);
      expect(await res401.json()).toEqual({ error: "Login first" });

      const res403 = handleCommentError(new ForbiddenCommentError("No access"));
      expect(res403.status).toBe(403);
      expect(await res403.json()).toEqual({ error: "No access" });

      const res404 = handleCommentError(new NotFoundCommentError("Not found"));
      expect(res404.status).toBe(404);
      expect(await res404.json()).toEqual({ error: "Not found" });

      const res429 = handleCommentError(new RateLimitCommentError("Too fast"));
      expect(res429.status).toBe(429);
      expect(await res429.json()).toEqual({ error: "Too fast" });

      const res500 = handleCommentError(new Error("Unexpected crash"));
      expect(res500.status).toBe(500);
      expect(await res500.json()).toEqual({ error: "Internal Server Error" });
    });
  });

  describe("Pagination Helpers", () => {
    it("parses valid cursors and serializes next cursor", () => {
      const now = new Date("2026-04-05T12:00:00.000Z");
      expect(parseCommentCursor(now.toISOString())?.toISOString()).toBe(now.toISOString());
      expect(parseCommentCursor("invalid")).toBeNull();
      expect(getNextCommentCursor(now)).toBe(now.toISOString());
      expect(getNextCommentCursor(null)).toBeNull();
    });
  });

  describe("createComment", () => {
    const mockCaller: CallerContext = {
      user: {
        id: "user-1",
        email: "user1@example.com",
        role: "user",
        name: "User One",
        image: null,
      },
      session: {},
      canModify: (resId: string) => resId === "user-1",
    };

    it("rejects unauthenticated caller when session is null", async () => {
      mocks.getSession.mockResolvedValue(null);
      const req = new Request("http://localhost/api/comments");

      await expect(
        createComment(req, {
          mangaId: "manga-1",
          content: "Hello",
        })
      ).rejects.toThrow(UnauthorizedCommentError);
    });

    it("rejects banned caller with Thai error message", async () => {
      mocks.getSession.mockResolvedValue({
        user: { id: "banned-user", email: "banned@test.com", banned: true },
      });
      const req = new Request("http://localhost/api/comments");

      await expect(
        createComment(req, {
          mangaId: "manga-1",
          content: "Hello",
        })
      ).rejects.toThrow("บัญชีของคุณถูกระงับการใช้งาน");
    });

    it("throws ValidationCommentError if mangaId is missing", async () => {
      await expect(
        createComment(mockCaller, {
          mangaId: "",
          content: "Hello",
        })
      ).rejects.toThrow(ValidationCommentError);
    });

    it("throws ValidationCommentError if content and image are both empty", async () => {
      await expect(
        createComment(mockCaller, {
          mangaId: "manga-1",
          content: "   ",
        })
      ).rejects.toThrow(ValidationCommentError);
    });

    it("throws ValidationCommentError if content exceeds 500 characters", async () => {
      await expect(
        createComment(mockCaller, {
          mangaId: "manga-1",
          content: "a".repeat(501),
        })
      ).rejects.toThrow("ความคิดเห็นต้องไม่เกิน 500 ตัวอักษร");
    });

    it("throws RateLimitCommentError when rate limit exceeded", async () => {
      mocks.checkRateLimit.mockResolvedValue({
        allowed: false,
        resetTime: Date.now() + 10 * 60 * 1000,
      });

      await expect(
        createComment(mockCaller, {
          mangaId: "manga-1",
          content: "Hello",
        })
      ).rejects.toThrow(RateLimitCommentError);
    });
  });

  describe("updateComment", () => {
    const mockCaller: CallerContext = {
      user: {
        id: "user-1",
        email: "user1@example.com",
        role: "user",
        name: "User One",
        image: null,
      },
      session: {},
      canModify: (resId: string) => resId === "user-1",
    };

    it("throws ValidationCommentError if commentId is missing", async () => {
      await expect(
        updateComment(mockCaller, {
          commentId: "",
          content: "New content",
        })
      ).rejects.toThrow(ValidationCommentError);
    });

    it("throws ValidationCommentError if content is empty", async () => {
      await expect(
        updateComment(mockCaller, {
          commentId: "comment-1",
          content: "   ",
        })
      ).rejects.toThrow(ValidationCommentError);
    });
  });

  describe("deleteComment", () => {
    const mockCaller: CallerContext = {
      user: {
        id: "user-1",
        email: "user1@example.com",
        role: "user",
        name: "User One",
        image: null,
      },
      session: {},
      canModify: (resId: string) => resId === "user-1",
    };

    it("throws ValidationCommentError if commentId is missing", async () => {
      await expect(deleteComment(mockCaller, "")).rejects.toThrow(
        ValidationCommentError
      );
    });
  });

  describe("voteComment", () => {
    const mockCaller: CallerContext = {
      user: {
        id: "user-1",
        email: "user1@example.com",
        role: "user",
        name: "User One",
        image: null,
      },
      session: {},
      canModify: (resId: string) => resId === "user-1",
    };

    it("throws ValidationCommentError if value is invalid", async () => {
      await expect(
        voteComment(mockCaller, {
          commentId: "comment-1",
          value: 0 as any,
        })
      ).rejects.toThrow(ValidationCommentError);
    });
  });

  describe("listComments", () => {
    it("throws ValidationCommentError if mangaId is missing", async () => {
      await expect(
        listComments({
          mangaId: "",
        })
      ).rejects.toThrow(ValidationCommentError);
    });
  });
});

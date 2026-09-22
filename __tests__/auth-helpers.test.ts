import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

import {
  authenticateRequest,
  authenticateCaller,
  canModifyResource,
  isValidCallbackUrl,
  BANNED_ERROR,
} from "../lib/auth-helpers";

describe("Auth Intake Module (lib/auth-helpers.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authenticateRequest", () => {
    it("returns 401 response when unauthenticated", async () => {
      mocks.getSession.mockResolvedValue(null);

      const request = new Request("http://localhost/api/test");
      const result = await authenticateRequest(request);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.response.status).toBe(401);
        const data = await result.response.json();
        expect(data.error).toBe("Unauthorized");
      }
    });

    it("returns 403 with Thai message when user is banned", async () => {
      mocks.getSession.mockResolvedValue({
        user: { id: "banned-user", email: "banned@test.com", banned: true },
      });

      const request = new Request("http://localhost/api/test");
      const result = await authenticateRequest(request);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.response.status).toBe(403);
        const data = await result.response.json();
        expect(data.error).toBe(BANNED_ERROR);
      }
    });

    it("allows banned user when allowBanned option is true", async () => {
      mocks.getSession.mockResolvedValue({
        user: { id: "banned-user", email: "banned@test.com", banned: true, role: "user" },
      });

      const request = new Request("http://localhost/api/appeal");
      const result = await authenticateRequest(request, { allowBanned: true });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.caller.user.id).toBe("banned-user");
      }
    });

    it("returns 403 when admin role is required but caller is regular user", async () => {
      mocks.getSession.mockResolvedValue({
        user: { id: "user-1", email: "user@test.com", role: "user" },
      });

      const request = new Request("http://localhost/api/admin/settings");
      const result = await authenticateRequest(request, { role: "admin" });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.response.status).toBe(403);
        const data = await result.response.json();
        expect(data.error).toBe("Forbidden - Admin access required");
      }
    });

    it("returns caller context when caller meets role requirement", async () => {
      mocks.getSession.mockResolvedValue({
        user: { id: "admin-1", email: "admin@test.com", role: "admin", name: "Admin" },
      });

      const request = new Request("http://localhost/api/admin/settings");
      const result = await authenticateRequest(request, { role: "admin" });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.caller.user.id).toBe("admin-1");
        expect(result.caller.user.role).toBe("admin");
        expect(result.caller.canModify("any-user-id")).toBe(true);
      }
    });
  });

  describe("authenticateCaller", () => {
    it("returns typed caller context for regular user", async () => {
      mocks.getSession.mockResolvedValue({
        user: { id: "u-123", email: "u@test.com", role: "user" },
      });

      const result = await authenticateCaller();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.caller.user.id).toBe("u-123");
        expect(result.caller.canModify("u-123")).toBe(true);
        expect(result.caller.canModify("other-user")).toBe(false);
      }
    });

    it("returns BANNED code for banned user", async () => {
      mocks.getSession.mockResolvedValue({
        user: { id: "banned-1", isBanned: true },
      });

      const result = await authenticateCaller();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("BANNED");
        expect(result.status).toBe(403);
      }
    });
  });

  describe("canModifyResource", () => {
    it("allows admin to modify any resource", () => {
      const adminSession = { user: { id: "admin-1", role: "admin" } };
      expect(canModifyResource(adminSession, "resource-owner-2")).toBe(true);
    });

    it("allows resource owner to modify their resource", () => {
      const userSession = { user: { id: "user-1", role: "user" } };
      expect(canModifyResource(userSession, "user-1")).toBe(true);
      expect(canModifyResource(userSession, "other-user")).toBe(false);
    });

    it("rejects null session", () => {
      expect(canModifyResource(null, "any-id")).toBe(false);
    });
  });

  describe("isValidCallbackUrl", () => {
    it("allows valid relative URLs", () => {
      expect(isValidCallbackUrl("/profile")).toBe("/profile");
      expect(isValidCallbackUrl("/dashboard/admin")).toBe("/dashboard/admin");
    });

    it("rejects protocol-relative and external URLs", () => {
      expect(isValidCallbackUrl("//attacker.com")).toBe("/");
      expect(isValidCallbackUrl("https://attacker.com")).toBe("/");
      expect(isValidCallbackUrl(null)).toBe("/");
    });
  });
});

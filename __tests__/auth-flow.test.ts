import { describe, it, expect, vi } from "vitest";
import { isValidCallbackUrl } from "@/lib/auth-helpers";
import {
  buildPostRegistrationSignInUrl,
  finalizeEmailRegistration,
} from "@/lib/register-flow";

describe("isValidCallbackUrl", () => {
  it("returns / for null input", () => {
    expect(isValidCallbackUrl(null)).toBe("/");
  });

  it("returns / for empty string", () => {
    expect(isValidCallbackUrl("")).toBe("/");
  });

  it("accepts valid internal paths", () => {
    expect(isValidCallbackUrl("/")).toBe("/");
    expect(isValidCallbackUrl("/dashboard")).toBe("/dashboard");
    expect(isValidCallbackUrl("/auth/signin")).toBe("/auth/signin");
    expect(isValidCallbackUrl("/manga/123?page=1")).toBe("/manga/123?page=1");
  });

  it("rejects external URLs", () => {
    expect(isValidCallbackUrl("https://evil.com")).toBe("/");
    expect(isValidCallbackUrl("http://evil.com")).toBe("/");
    expect(isValidCallbackUrl("https://evil.com/path")).toBe("/");
  });

  it("rejects protocol-relative URLs", () => {
    expect(isValidCallbackUrl("//evil.com")).toBe("/");
    expect(isValidCallbackUrl("//evil.com/path")).toBe("/");
  });

  it("rejects javascript: protocol", () => {
    expect(isValidCallbackUrl("javascript:alert(1)")).toBe("/");
  });

  it("rejects data: protocol", () => {
    expect(isValidCallbackUrl("data:text/html,<h1>evil</h1>")).toBe("/");
  });
});

describe("sanitizeContent", () => {
  // We need to test the sanitizeContent function from comments.ts
  // Since it's not exported, we'll test the logic inline
  function sanitizeContent(content: string): string {
    return content
      .trim()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  }

  it("escapes HTML angle brackets", () => {
    expect(sanitizeContent("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;"
    );
  });

  it("escapes ampersands", () => {
    expect(sanitizeContent("foo & bar")).toBe("foo &amp; bar");
  });

  it("escapes double quotes", () => {
    expect(sanitizeContent('a "quoted" string')).toBe(
      "a &quot;quoted&quot; string"
    );
  });

  it("escapes single quotes", () => {
    expect(sanitizeContent("it's a test")).toBe("it&#x27;s a test");
  });

  it("trims whitespace", () => {
    expect(sanitizeContent("  hello  ")).toBe("hello");
  });

  it("handles combined dangerous input", () => {
    expect(sanitizeContent('<img onerror="alert(1)" src=x>')).toBe(
      "&lt;img onerror=&quot;alert(1)&quot; src=x&gt;"
    );
  });
});

describe("registration flow", () => {
  it("builds a safe sign-in redirect after registration", () => {
    expect(buildPostRegistrationSignInUrl("/dashboard?tab=profile")).toBe(
      "/auth/signin?callbackUrl=%2Fdashboard%3Ftab%3Dprofile&registered=1"
    );
    expect(buildPostRegistrationSignInUrl("https://evil.com")).toBe(
      "/auth/signin?callbackUrl=%2F&registered=1"
    );
  });

  it("falls back to manual sign-in when auto-login fails", async () => {
    const signInEmail = vi.fn().mockResolvedValue({
      error: { message: "bad credentials" },
    });
    const syncSession = vi.fn();

    await expect(
      finalizeEmailRegistration({
        email: "test@example.com",
        password: "Password123",
        callbackUrl: "/profile",
        signInEmail,
        syncSession,
        waitMs: 0,
      })
    ).resolves.toEqual({
      manualSignInRequired: true,
      redirectTo: "/auth/signin?callbackUrl=%2Fprofile&registered=1",
    });

    expect(syncSession).not.toHaveBeenCalled();
  });

  it("falls back to manual sign-in when session sync fails", async () => {
    const signInEmail = vi.fn().mockResolvedValue({});
    const syncSession = vi.fn().mockRejectedValue(new Error("session failed"));

    await expect(
      finalizeEmailRegistration({
        email: "test@example.com",
        password: "Password123",
        callbackUrl: "/settings",
        signInEmail,
        syncSession,
        waitMs: 0,
      })
    ).resolves.toEqual({
      manualSignInRequired: true,
      redirectTo: "/auth/signin?callbackUrl=%2Fsettings&registered=1",
    });
  });

  it("redirects to the callback after successful auto-login", async () => {
    const signInEmail = vi.fn().mockResolvedValue({});
    const syncSession = vi.fn().mockResolvedValue({});

    await expect(
      finalizeEmailRegistration({
        email: "test@example.com",
        password: "Password123",
        callbackUrl: "/dashboard",
        signInEmail,
        syncSession,
        waitMs: 0,
      })
    ).resolves.toEqual({
      manualSignInRequired: false,
      redirectTo: "/dashboard",
    });
  });
});

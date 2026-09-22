import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  checkRateLimit: vi.fn(),
  storeAssets: vi.fn(),
}));

vi.mock("@/lib/auth-helpers", () => ({
  authenticateRequest: mocks.authenticateRequest,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock("@/lib/storage", () => ({
  storeAssets: mocks.storeAssets,
}));

import { POST } from "@/app/api/upload/route";

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.authenticateRequest.mockResolvedValue({
      ok: true,
      caller: {
        user: { id: "user-1", email: "user@example.com", role: "user" },
      },
    });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.storeAssets.mockResolvedValue([
      {
        url: "https://cdn.example.com/page.png",
        key: "uploads/2026/09/demo-manga/page.png",
        contentType: "image/png",
        size: 100,
        width: 0,
        height: 0,
      },
    ]);
  });

  it("stores original image bytes without server-side transcoding", async () => {
    const formData = new FormData();
    formData.append(
      "files",
      new File([Buffer.from("good-image")], "good.png", { type: "image/png" })
    );
    formData.append("mangaId", "demo-manga");

    const response = await POST(
      new Request("http://localhost/api/upload", {
        method: "POST",
        body: formData,
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.storeAssets).toHaveBeenCalledTimes(1);
    expect(mocks.storeAssets).toHaveBeenCalledWith(
      expect.any(Array),
      { kind: "manga-page", mangaId: "demo-manga" }
    );
  });

  it("allows a full chapter-sized batch instead of stopping at 50 files", async () => {
    const formData = new FormData();
    formData.append(
      "files",
      new File([Buffer.from("chapter-page")], "page.webp", { type: "image/webp" })
    );

    const response = await POST(
      new Request("http://localhost/api/upload", {
        method: "POST",
        body: formData,
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.checkRateLimit).toHaveBeenCalledWith(
      "upload:user-1",
      expect.any(Number),
      60 * 60 * 1000
    );
    expect(mocks.checkRateLimit.mock.calls[0][1]).toBeGreaterThanOrEqual(147);
  });
});

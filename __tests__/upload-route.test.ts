import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  checkRateLimit: vi.fn(),
  readValidatedImageFile: vi.fn(),
  isUserBanned: vi.fn(),
  isAdminRole: vi.fn(),
  send: vi.fn(),
  getR2PublicUrl: vi.fn((key: string) => `https://cdn.example.com/${key}`),
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

vi.mock("@/lib/image-security", () => ({
  readValidatedImageFile: mocks.readValidatedImageFile,
  sanitizeObjectKeySegment: vi.fn((value: string) => value),
}));

vi.mock("@/lib/session-utils", () => ({
  isUserBanned: mocks.isUserBanned,
  isAdminRole: mocks.isAdminRole,
}));

vi.mock("@/lib/r2", () => ({
  r2Client: {
    send: mocks.send,
  },
  R2_BUCKET: "test-bucket",
  getR2PublicUrl: mocks.getR2PublicUrl,
}));

vi.mock("@aws-sdk/client-s3", () => ({
  PutObjectCommand: class PutObjectCommand {
    constructor(input: Record<string, unknown>) {
      Object.assign(this, input);
    }
  },
}));

import { POST } from "@/app/api/upload/route";

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getSession.mockResolvedValue({
      user: { id: "user-1", email: "user@example.com" },
    });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.readValidatedImageFile.mockResolvedValue({
      buffer: Buffer.from("original-image"),
    });
    mocks.isUserBanned.mockReturnValue(false);
    mocks.isAdminRole.mockReturnValue(false);
    mocks.send.mockResolvedValue({});
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
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.send.mock.calls[0][0]).toMatchObject({
      Bucket: "test-bucket",
      ContentType: "image/png",
    });
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

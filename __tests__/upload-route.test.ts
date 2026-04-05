import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  checkRateLimit: vi.fn(),
  readValidatedImageFile: vi.fn(),
  isUserBanned: vi.fn(),
  send: vi.fn(),
  sharp: vi.fn(),
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

vi.mock("sharp", () => ({
  default: mocks.sharp,
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
    mocks.send.mockResolvedValue({});
    mocks.sharp.mockReturnValue({
      metadata: vi.fn().mockResolvedValue({
        width: 1200,
        height: 800,
        format: "png",
      }),
      resize: vi.fn().mockReturnThis(),
      webp: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockResolvedValue(Buffer.from("webp-image")),
    });
  });

  it("returns 400 when image dimensions are out of range", async () => {
    mocks.sharp.mockReturnValue({
      metadata: vi.fn().mockResolvedValue({
        width: 9001,
        height: 800,
        format: "png",
      }),
      resize: vi.fn().mockReturnThis(),
      webp: vi.fn().mockReturnThis(),
      toBuffer: vi.fn(),
    });

    const formData = new FormData();
    formData.append(
      "files",
      new File([Buffer.from("bad-image")], "bad.png", { type: "image/png" })
    );

    const response = await POST(
      new Request("http://localhost/api/upload", {
        method: "POST",
        body: formData,
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Image dimensions out of valid range (10-8000px)",
    });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("stores transcoded uploads as image/webp", async () => {
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
      ContentType: "image/webp",
    });
  });
});

import { describe, expect, it } from "vitest";

import { extractFirstUploadUrl } from "../lib/upload-response";

describe("extractFirstUploadUrl", () => {
  it("returns a string url directly", () => {
    expect(
      extractFirstUploadUrl({
        urls: ["https://cdn.example.com/image.webp"],
      })
    ).toBe("https://cdn.example.com/image.webp");
  });

  it("returns the nested url from an upload object", () => {
    expect(
      extractFirstUploadUrl({
        urls: [{ url: "https://cdn.example.com/image.webp", width: 100 }],
      })
    ).toBe("https://cdn.example.com/image.webp");
  });

  it("throws when the payload has no usable url", () => {
    expect(() => extractFirstUploadUrl({ urls: [{}] })).toThrow(
      "รูปแบบข้อมูลตอบกลับไม่ถูกต้อง"
    );
  });
});

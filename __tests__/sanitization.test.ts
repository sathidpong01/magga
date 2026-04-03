import { describe, expect, it } from "vitest";

import { sanitizeResponse } from "../lib/api-sanitization";
import {
  sanitizeFilename,
  sanitizeHtml,
  sanitizeInput,
} from "../lib/sanitize";
import { validatePassword } from "../lib/password-validation";

describe("sanitize helpers", () => {
  it("escapes dangerous input and normalizes filenames", () => {
    expect(sanitizeInput('  <script>alert("x")</script>  ')).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;&#x2F;script&gt;"
    );
    expect(sanitizeHtml('<div onclick="alert(1)"><script>bad()</script>ok</div>')).toBe(
      '<div >ok</div>'
    );
    expect(sanitizeFilename("../my cover 01?.jpg")).toBe("my_cover_01_.jpg");
  });

  it("removes sensitive fields recursively", () => {
    expect(
      sanitizeResponse({
        id: "1",
        password: "secret",
        nested: {
          apiKey: "hidden",
          publicValue: "ok",
        },
      })
    ).toEqual({
      id: "1",
      nested: {
        publicValue: "ok",
      },
    });
  });
});

describe("password validation", () => {
  it("rejects weak passwords and accepts a strong one", () => {
    expect(validatePassword("short")).toMatchObject({
      isValid: false,
      strength: "weak",
    });

    expect(validatePassword("StrongPass123")).toMatchObject({
      isValid: true,
      strength: "strong",
    });
  });
});

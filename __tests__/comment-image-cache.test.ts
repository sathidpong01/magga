import { describe, expect, it } from "bun:test";
import { createRequire } from "node:module";
// Use the installed framework matcher so tests cover its actual glob behavior.
const require = createRequire(import.meta.url);
const { hasLocalMatch } = require("next/dist/shared/lib/match-local-pattern");

describe("private comment media cannot escape through Next image caching", () => {
  it("allows static assets and rejects API media, including encoded/query variants", async () => {
    const { default: config } = await import("../next.config.mjs");
    const patterns = config.images.localPatterns;
    for (const path of ["/logo.svg", "/age18ver.webp", "/favicon-32x32.png", "/_next/static/media/picture.hash.webp"]) expect(hasLocalMatch(patterns, path)).toBe(true);
    for (const path of ["/api/comments/media/11111111-1111-4111-8111-111111111111", "/api%2fcomments%2fmedia%2fasset", "/logo.svg?url=/api/comments/media/asset", "/api/comments/media/asset.webp"]) expect(hasLocalMatch(patterns, path)).toBe(false);
  });
});

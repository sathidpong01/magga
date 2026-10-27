import { expect, it } from "bun:test";
import { authorSocialLinks, authorLinkLabel } from "@/lib/author-social-links";
it("handles legacy invalid JSON and non-array values without crashing the author list", () => {
  for (const socialLinks of ["broken", "{}", "null", "42"]) expect(authorSocialLinks({ socialLinks, profileUrl: "https://example.com/profile" })).toEqual([{ url: "https://example.com/profile", label: "", icon: "" }]);
});
it("filters malformed entries and unsafe schemes while retaining supported social links", () => {
  const links = authorSocialLinks({ profileUrl: null, socialLinks: JSON.stringify([null, 1, { url: "javascript:alert(1)" }, { url: "bad" }, { url: "https://example.com/artist", label: "Artist", icon: "invalid" }]) });
  expect(links).toEqual([{ url: "https://example.com/artist", label: "Artist", icon: "" }]);
});
it("provides a readable hostname for an unlabeled link", () => {
  expect(authorLinkLabel({ url: "https://www.example.com/profile", label: "", icon: "" })).toBe("example.com");
  expect(authorSocialLinks({ socialLinks: null, profileUrl: "invalid" })).toEqual([]);
});

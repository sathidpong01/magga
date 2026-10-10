import { describe, expect, it } from "bun:test";
import { enrichUnchangedItem } from "@/lib/form-metadata";
describe("late form metadata", () => {
  const original = { url: "https://author.example", label: "Original", icon: "" };
  it("follows an unchanged item through a reorder without overwriting adjacent edits", () => {
    const adjacent = { url: "https://other.example", label: "New draft", icon: "" };
    expect(enrichUnchangedItem([adjacent, original], original, { title: "Author" })).toEqual([adjacent, { ...original, label: "Author" }]);
  });
  it("does not resurrect a deleted item or overwrite an edited URL/label", () => {
    const edited = { ...original, label: "Typed by user" };
    expect(enrichUnchangedItem([], original, { title: "Old request" })).toEqual([]);
    expect(enrichUnchangedItem([edited], original, { title: "Old request" })).toEqual([edited]);
  });
});

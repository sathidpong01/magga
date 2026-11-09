import { afterEach, expect, it, jest } from "bun:test";
import { PollDraftImages } from "@/lib/polls/draft-images";
import { parsePollInput } from "@/lib/polls/validation";

const drafts = new PollDraftImages();
const file = (name: string) => new File([name], name, { type: "image/png" });
const input = () =>
  parsePollInput({
    title: "ทดสอบโพล",
    description: "",
    visibility: "public",
    resultsVisibility: "public",
    security: "standard",
    minChoices: 1,
    maxChoices: 1,
    allowChange: false,
    showCount: true,
    showOnHome: true,
    pinned: false,
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 86400000).toISOString(),
    options: ["หนึ่ง", "สอง"].map((label) => ({
      id: crypto.randomUUID(),
      label,
      assetId: null,
      mangaId: null,
    })),
  });
afterEach(() => {
  drafts.clear();
  jest.restoreAllMocks();
});

it("previews locally, replaces and removes files without starting an upload", () => {
  const revoke = jest.spyOn(URL, "revokeObjectURL");
  const first = drafts.select("cover", file("first.png"));
  expect(first.startsWith("blob:")).toBe(true);
  const second = drafts.select("cover", file("second.png"));
  expect(second).not.toBe(first);
  expect(revoke).toHaveBeenCalledWith(first);
  drafts.remove("cover");
  expect(revoke).toHaveBeenCalledWith(second);
  expect(drafts.pending).toBe(false);
});

it("uploads only the latest selected files at save, preserves order and leaves input untouched", async () => {
  const value = input();
  drafts.select(value.options[1].id, file("discarded.png"));
  drafts.select(value.options[1].id, file("second.png"));
  drafts.select("cover", file("cover.png"));
  const upload = jest.fn(async (file: File) => ({
    id: crypto.randomUUID(),
    url: `/${file.name}`,
  }));
  expect(upload).not.toHaveBeenCalled();
  const saved = await drafts.prepare(value, upload);
  expect(upload.mock.calls.map(([file]) => file.name)).toEqual([
    "second.png",
    "cover.png",
  ]);
  expect(saved.options.map((option) => option.id)).toEqual(
    value.options.map((option) => option.id),
  );
  expect(saved.options[1].assetId).toBeTruthy();
  expect(saved.coverAssetId).toBeTruthy();
  expect(value.options[1].assetId).toBeNull();
  expect(value.coverAssetId).toBeNull();
  expect(drafts.pending).toBe(true);
});

it("reuses completed uploads when a later upload or the poll save fails", async () => {
  const value = input();
  drafts.select("cover", file("cover.png"));
  drafts.select(value.options[0].id, file("option.png"));
  let failed = false;
  const upload = jest.fn(async (file: File) => {
    if (file.name === "option.png" && !failed) {
      failed = true;
      throw new Error("offline");
    }
    return { id: crypto.randomUUID(), url: `/${file.name}` };
  });
  await expect(drafts.prepare(value, upload)).rejects.toThrow("offline");
  expect(drafts.pending).toBe(true);
  const saved = await drafts.prepare(value, upload);
  expect(await drafts.prepare(value, upload)).toEqual(saved);
  expect(upload.mock.calls.map(([file]) => file.name)).toEqual([
    "cover.png",
    "option.png",
    "option.png",
  ]);
});

it("never uploads removed options, releases previews on teardown and rejects invalid replacements", async () => {
  const value = input();
  const preview = drafts.select("cover", file("keep.png"));
  expect(() =>
    drafts.select(
      "cover",
      new File(["svg"], "bad.svg", { type: "image/svg+xml" }),
    ),
  ).toThrow("รองรับเฉพาะ");
  expect(() =>
    drafts.select(
      "cover",
      new File([new Uint8Array(3 * 1024 * 1024 + 1)], "huge.png", {
        type: "image/png",
      }),
    ),
  ).toThrow("3 MB");
  const removed = crypto.randomUUID();
  drafts.select(removed, file("removed.png"));
  const upload = jest.fn(async (file: File) => ({
    id: crypto.randomUUID(),
    url: `/${file.name}`,
  }));
  await drafts.prepare(value, upload);
  expect(upload.mock.calls.map(([file]) => file.name)).toEqual(["keep.png"]);
  const revoke = jest.spyOn(URL, "revokeObjectURL");
  drafts.clear();
  expect(revoke).toHaveBeenCalledWith(preview);
  expect(drafts.pending).toBe(false);
});

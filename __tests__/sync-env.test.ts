import { describe, expect, it } from "bun:test";
const { parseOptions, syncEnvironment } = require("../scripts/sync-env.js");
describe("explicit environment synchronization", () => {
  it("requires an explicit single target and key allowlist", () => {
    expect(() => parseOptions([])).toThrow();
    expect(() => parseOptions(["--target", "production,preview", "--keys", "API_KEY"])).toThrow();
    expect(() => parseOptions(["--target", "preview", "--keys", "--bad-key"])).toThrow();
  });
  it("dry-run neither executes the CLI nor prints values", () => {
    const lines: string[] = [];
    syncEnvironment(parseOptions(["--target", "preview", "--keys", "API_KEY", "--dry-run"]), { API_KEY: "fixture-secret" }, () => { throw new Error("should never run"); }, (line: string) => lines.push(line));
    expect(lines.join("\n")).toContain("Would sync API_KEY to preview");
    expect(lines.join("\n")).not.toContain("fixture-secret");
  });
  it("sends only selected values via stdin, never argv, and fails on partial errors", () => {
    const calls: { args: string[]; input: string }[] = [];
    const execute = (_runtime: string, args: string[], options: { input: string }) => { calls.push({ args, input: options.input }); if (args.includes("SECOND_KEY")) throw new Error("fixture-secret"); };
    const lines: string[] = [];
    expect(() => syncEnvironment(parseOptions(["--target", "preview", "--keys", "API_KEY,SECOND_KEY"]), { API_KEY: "fixture-secret", SECOND_KEY: "other-secret", UNSELECTED: "must-not-send" }, execute, (line: string) => lines.push(line))).toThrow("synchronization failed");
    expect(calls).toHaveLength(2);
    expect(calls[0].input).toBe("fixture-secret");
    expect(calls.map(call => call.args.join(" ")).join(" ")).not.toContain("fixture-secret");
    expect(lines.join(" ")).not.toContain("fixture-secret");
  });
});

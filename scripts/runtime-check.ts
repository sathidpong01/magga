import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const expected = readFileSync(resolve(import.meta.dir, "../.bun-version"), "utf8").trim();
if (Bun.version !== expected) {
  throw new Error(`Expected Bun ${expected}, received ${Bun.version}.`);
}
const child = Bun.spawnSync([process.execPath, "--no-env-file", "-e", "process.stdout.write(Bun.version)"], {
  stdout: "pipe",
  stderr: "pipe",
});
if (child.exitCode !== 0 || child.stdout.toString() !== expected) {
  throw new Error("Child process did not run the pinned Bun runtime.");
}
console.log(`Bun ${Bun.version}: parent and child runtime verified (${process.platform}).`);

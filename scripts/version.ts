import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const increment = Bun.argv[2];
if (!["patch", "minor", "major"].includes(increment)) {
  throw new Error("Usage: bun run version patch|minor|major");
}

const manifestPath = resolve(import.meta.dir, "../package.json");
const lockPath = resolve(import.meta.dir, "../bun.lock");
const originalManifest = readFileSync(manifestPath, "utf8");
const originalLock = readFileSync(lockPath, "utf8");
const manifest = JSON.parse(originalManifest);
const version = /^(\d+)\.(\d+)\.(\d+)$/.exec(manifest.version);
if (!version) throw new Error("Version helper requires a stable semantic version.");
let [, major, minor, patch] = version.map(Number);
if (increment === "major") { major++; minor = 0; patch = 0; }
else if (increment === "minor") { minor++; patch = 0; }
else patch++;
manifest.version = `${major}.${minor}.${patch}`;
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

try {
  const update = Bun.spawnSync([process.execPath, "install", "--lockfile-only", "--ignore-scripts"], {
    cwd: resolve(import.meta.dir, ".."),
    stdout: "inherit",
    stderr: "inherit",
  });
  if (update.exitCode !== 0) throw new Error("Lockfile update failed.");
} catch (error) {
  writeFileSync(manifestPath, originalManifest);
  writeFileSync(lockPath, originalLock);
  throw new Error("Lockfile update failed; restored the previous version.", { cause: error });
}
console.log(`v${manifest.version}`);

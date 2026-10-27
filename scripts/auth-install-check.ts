import { createRequire } from "node:module";
import { readFileSync, realpathSync } from "node:fs";
import { resolve } from "node:path";

/** Reject incompatible package versions or independently resolved auth cores. */
export function checkAuthInstall(root = resolve(import.meta.dir, "..")) {
  const project = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
  const expected = project.dependencies["better-auth"];
  const require = createRequire(resolve(root, "package.json"));
  const canonicalCore = realpathSync(require.resolve("@better-auth/core/package.json"));
  const packages = ["better-auth", "@better-auth/core", "@better-auth/drizzle-adapter"];
  for (const name of packages) {
    const file = require.resolve(`${name}/package.json`);
    const version = JSON.parse(readFileSync(file, "utf8")).version;
    const localRequire = createRequire(file);
    const core = realpathSync(localRequire.resolve("@better-auth/core/package.json"));
    if (version !== expected || core !== canonicalCore) {
      throw new Error(`AUTH_INSTALL_MISMATCH: ${name} must use ${expected} and the shared core. Reinstall from bun.lock in a clean dependency directory; on Vercel retry without the existing build cache.`);
    }
  }
  return expected as string;
}

if (import.meta.main) console.log(`Better Auth ${checkAuthInstall()}: package family and shared core verified.`);

const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const path = require('node:path');

// Resolve only the isolated tool installation; never use a global CLI by accident.
function resolveVercelCli() {
  const directory = path.join(__dirname, '..', 'tools', 'vercel');
  const expected = require('../tools/vercel/package.json').dependencies.vercel;
  try {
    const installed = JSON.parse(readFileSync(path.join(directory, 'node_modules', 'vercel', 'package.json'), 'utf8'));
    if (installed.version !== expected) throw new Error('Version mismatch');
    return path.join(directory, 'node_modules', 'vercel', 'dist', 'index.js');
  } catch {
    throw new Error('Install the pinned Vercel tool first: bun install --cwd tools/vercel --frozen-lockfile');
  }
}

if (require.main === module) {
  try {
    const result = spawnSync(process.execPath, [resolveVercelCli(), ...process.argv.slice(2)], {
      cwd: path.join(__dirname, '..'), stdio: 'inherit',
    });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { resolveVercelCli };

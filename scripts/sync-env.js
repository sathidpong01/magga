const { execFileSync } = require('node:child_process');
const { parse } = require('dotenv');
const fs = require('node:fs');
const path = require('node:path');

function parseOptions(args) {
  const options = { target: '', keys: [], envFile: path.join(__dirname, '../.env.local'), dryRun: false };
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (flag === '--dry-run') options.dryRun = true;
    else if (flag === '--target') options.target = args[++i];
    else if (flag === '--keys') options.keys = (args[++i] || '').split(',').map(key => key.trim()).filter(Boolean);
    else if (flag === '--env-file') options.envFile = path.resolve(args[++i] || '');
    else throw new Error('Unknown option');
  }
  if (!['production', 'preview', 'development'].includes(options.target)) throw new Error('Specify one --target production|preview|development');
  if (!options.keys.length || options.keys.some(key => !/^[A-Z_][A-Z0-9_]*$/.test(key))) throw new Error('Specify explicit --keys KEY,OTHER_KEY');
  options.keys = [...new Set(options.keys)];
  return options;
}
function syncEnvironment(options, envVars, execute = execFileSync, log = console.log) {
  for (const key of options.keys) {
    if (!Object.prototype.hasOwnProperty.call(envVars, key)) throw new Error(`Missing selected key: ${key}`);
  }
  if (options.dryRun) { options.keys.forEach(key => log(`Would sync ${key} to ${options.target}`)); return; }
  const vercelCli = require.resolve('vercel/dist/index.js');
  let failed = false;
  for (const key of options.keys) {
    try {
      execute(process.execPath, [vercelCli, 'env', 'add', key, options.target, '--force', '--yes'], {
        input: envVars[key], timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'], cwd: path.join(__dirname, '..'),
      });
      log(`Synced ${key} to ${options.target}`);
    } catch { failed = true; log(`Failed to sync ${key} to ${options.target}`); }
  }
  if (failed) throw new Error('Environment synchronization failed; review selected keys before retrying');
}
if (require.main === module) {
  try {
    const options = parseOptions(process.argv.slice(2));
    const envVars = parse(fs.readFileSync(options.envFile, 'utf8'));
    syncEnvironment(options, envVars);
  } catch (error) {
    // Child-process output is intentionally never printed: it may contain values.
    console.error(error.message.startsWith('ENOENT') ? 'Environment file not found' : error.message);
    process.exitCode = 1;
  }
}
module.exports = { parseOptions, syncEnvironment };

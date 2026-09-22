// Codex http_headers_helper: stdout contains a secret header, never log it.
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
try {
  const key = JSON.parse(readFileSync(resolve(__dirname, '../.local/mcp-production-backup/preview-credentials.json'), 'utf8'));
  if (key.project !== 'ssgsxrdobafxkiuigoqw' || !/^mgm_[a-f0-9]{64}$/.test(key.token) || !Number.isFinite(Date.parse(key.expiresAt)) || Date.parse(key.expiresAt) <= Date.now()) {
    throw new Error('Invalid preview credential');
  }
  process.stdout.write(JSON.stringify({ Authorization: `Bearer ${key.token}` }));
} catch {
  process.stderr.write('Hosted MCP credentials are unavailable or expired. Reissue the preview key.\n');
  process.exitCode = 1;
}

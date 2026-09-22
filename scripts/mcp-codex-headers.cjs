// Codex http_headers_helper: stdout is reserved for the authentication header.
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

try {
  const credentials = JSON.parse(readFileSync(resolve(__dirname, '../.local/mcp/client-credentials.json'), 'utf8'));
  const { token, expiresAt } = credentials.writer;
  if (!/^mgm_[a-f0-9]{64}$/.test(token) || !expiresAt || Date.parse(expiresAt) <= Date.now() || !Number.isFinite(Date.parse(expiresAt))) {
    throw new Error('Invalid or expired local credentials');
  }
  process.stdout.write(JSON.stringify({ Authorization: `Bearer ${token}` }));
} catch {
  process.stderr.write('Local MCP credentials are unavailable or expired. Reissue the local writer key.\n');
  process.exitCode = 1;
}

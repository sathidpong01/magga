import { afterEach, expect, test } from 'vitest';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const folders: string[] = [];
afterEach(() => { for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true }); });
function run(credentials?: unknown, preview = false) {
  const folder = mkdtempSync(join(tmpdir(), 'magga-headers-'));
  folders.push(folder);
  mkdirSync(join(folder, 'scripts'));
  mkdirSync(join(folder, '.local/mcp'), { recursive: true });
  mkdirSync(join(folder, '.local/mcp-production-backup'), { recursive: true });
  const helper = join(folder, 'scripts/helper.cjs');
  copyFileSync(resolve(preview ? 'scripts/mcp-preview-headers.cjs' : 'scripts/mcp-codex-headers.cjs'), helper);
  if (credentials !== undefined) writeFileSync(join(folder, preview ? '.local/mcp-production-backup/preview-credentials.json' : '.local/mcp/client-credentials.json'), JSON.stringify(credentials));
  return spawnSync(process.execPath, [helper], { encoding: 'utf8', windowsHide: true });
}
const token = `mgm_${'a'.repeat(64)}`;
test('hosted helper requires the expected project and a valid expiry', () => {
  const key = { project: 'ssgsxrdobafxkiuigoqw', token, expiresAt: new Date(Date.now() + 60_000).toISOString() };
  const good = run(key, true);
  expect(good.status).toBe(0);
  expect(JSON.parse(good.stdout)).toEqual({ Authorization: `Bearer ${token}` });
  for (const invalid of [{ ...key, project: 'another-project' }, { ...key, expiresAt: 'invalid' }, { ...key, expiresAt: '2020-01-01' }]) {
    const result = run(invalid, true);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).not.toContain(token);
  }
});
test('emits only the expected header for a valid local key', () => {
  const result = run({ writer: { token, expiresAt: new Date(Date.now() + 60_000).toISOString() } });
  expect(result.status).toBe(0);
  expect(result.stderr).toBe('');
  expect(JSON.parse(result.stdout)).toEqual({ Authorization: `Bearer ${token}` });
});
test.each([undefined, {}, { writer: { token, expiresAt: 'invalid' } }, { writer: { token, expiresAt: '2020-01-01' } }, { writer: { token: 'bad-secret', expiresAt: '2099-01-01' } }])('fails closed without disclosing invalid credentials', (credentials) => {
  const result = run(credentials);
  expect(result.status).toBe(1);
  expect(result.stdout).toBe('');
  expect(result.stderr).toBe('Local MCP credentials are unavailable or expired. Reissue the local writer key.\n');
});

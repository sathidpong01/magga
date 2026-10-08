import { expect, test } from 'bun:test';
import { PGlite } from '@electric-sql/pglite';
import postgres from 'postgres';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

test.each([
  ['SIGINT active client', 'SIGINT', false], ['SIGTERM active client', 'SIGTERM', false],
  ['SIGINT disconnected client', 'SIGINT', true], ['SIGTERM disconnected client', 'SIGTERM', true],
] as const)('local DB shutdown: %s', async (_scenario, signal, disconnected) => {
  const directory = mkdtempSync(join(tmpdir(), 'magga-db-shutdown-'));
  const dataPath = join(directory, '.local/mcp/db');
  mkdirSync(join(directory, '.local/mcp'), { recursive: true });
  const initial = await PGlite.create(dataPath);
  await initial.exec("CREATE TABLE shutdown_fixture(value text); INSERT INTO shutdown_fixture VALUES ('persisted');");
  await initial.close();
  const preload = join(directory, 'signal.cjs');
  // Emitting signals avoids platform-specific Windows signal delivery while running the real handler.
  writeFileSync(preload, `process.stdin.once('data', () => { process.stdin.destroy(); process.emit(${JSON.stringify(signal)}); });`);
  const child = Bun.spawn([process.execPath, '--no-env-file', '--preload', preload, resolve('scripts/mcp-local-db.ts')], {
    cwd: directory, stdin: 'pipe', stdout: 'pipe', stderr: 'pipe',
  });
  const sql = postgres('postgresql://postgres:postgres@127.0.0.1:55432/postgres', { max: 1, prepare: false, connect_timeout: 5 });
  try {
    const output = child.stdout.getReader();
    const ready = await Promise.race([
      output.read(),
      child.exited.then(code => { throw new Error(`Local database exited before readiness: ${code}`); }),
    ]);
    expect(new TextDecoder().decode(ready.value)).toContain('endpoint ready');
    expect((await sql`SELECT value FROM shutdown_fixture`)[0].value).toBe('persisted');
    if (disconnected) await sql.end({ timeout: 5 });
    child.stdin.write('shutdown\n');
    child.stdin.end();
    expect(await child.exited).toBe(0);
    expect(await new Response(child.stderr).text()).toBe('');
    const reopened = await PGlite.create(dataPath);
    try { expect((await reopened.query<{ value: string }>('SELECT value FROM shutdown_fixture')).rows[0].value).toBe('persisted'); }
    finally { await reopened.close(); }
  } finally {
    child.kill();
    await child.exited;
    await sql.end({ timeout: 5 });
    rmSync(directory, { recursive: true, force: true });
  }
}, 15_000);

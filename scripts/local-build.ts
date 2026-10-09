import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setImmediate } from 'node:timers/promises';
import { verifyDisposableSchema } from './disposable-schema-check';

// Never reuse .local/mcp, imported snapshots, or an existing connection URL.
const root = resolve(import.meta.dir, '..');
const url = 'postgresql://postgres:postgres@127.0.0.1:55433/postgres';
const keepDatabase = Bun.argv.includes('--keep-db');
const prepareOnly = Bun.argv.includes('--prepare-only');
const expectedBun = readFileSync(join(root, '.bun-version'), 'utf8').trim();
if (Bun.version !== expectedBun) throw new Error(`Expected Bun ${expectedBun}.`);
for (const name of ['.env', '.env.local', '.env.production', '.env.production.local']) {
  if (existsSync(join(root, name))) {
    throw new Error(`Disposable build requires a checkout without ${name}; do not move or overwrite existing credentials.`);
  }
}
if (Bun.argv.slice(2).some(argument => !['--keep-db', '--prepare-only'].includes(argument))) {
  throw new Error('Usage: bun --no-env-file scripts/local-build.ts [--keep-db] [--prepare-only]');
}

const directory = mkdtempSync(join(tmpdir(), 'magga-build-fixture-'));
const databasePath = join(directory, 'db');
console.log(JSON.stringify({
  purpose: 'fresh disposable synthetic TEST database',
  host: '127.0.0.1', port: 55433, database: 'postgres', path: databasePath,
  productionCredentials: false,
}));

const environment: Record<string, string | undefined> = { ...process.env };
for (const key of Object.keys(environment)) {
  if (/^(DATABASE_URL|POSTGRES_|MCP_|MAGGA_DISPOSABLE_DATABASE|NEXT_PHASE|R2_|GOOGLE_|SUPABASE_|NEXT_PUBLIC_SUPABASE_|TURNSTILE_|NEXT_PUBLIC_TURNSTILE_|BETTER_AUTH_|AUTH_SECRET|ADMIN_|CRON_SECRET|COMMENT_ABUSE_SECRET|VERCEL)/.test(key)) {
    delete environment[key];
  }
}
Object.assign(environment, {
  DATABASE_URL: url,
  MAGGA_DISPOSABLE_DATABASE: 'true',
  BETTER_AUTH_SECRET: 'magga-disposable-test-secret-at-least-32-characters',
  BETTER_AUTH_URL: 'http://localhost:3101',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3101',
  NEXT_PUBLIC_DEV_APP_URL: 'http://localhost:3101',
  NEXT_TELEMETRY_DISABLED: '1',
  NODE_ENV: 'production',
});
const db = await PGlite.create(databasePath);
const server = new PGLiteSocketServer({ db, host: '127.0.0.1', port: 55433, maxConnections: 64, idleTimeout: 30000 });
let started = false;
let closing = false;
let interrupted = false;
let activeChild: ReturnType<typeof Bun.spawn> | undefined;
let resolveStop: (() => void) | undefined;
const stop = () => {
  interrupted = true;
  activeChild?.kill();
  resolveStop?.();
};
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
async function close() {
  if (closing) return;
  closing = true;
  if (started) await server.stop();
  // pglite-socket 0.2.11 detaches clients on setImmediate.
  await setImmediate();
  await db.close();
}
async function run(script: string, ...arguments_: string[]) {
  if (interrupted) throw new Error('Disposable build interrupted.');
  const child = Bun.spawn([process.execPath, '--no-env-file', 'run', script, ...arguments_], {
    cwd: root, env: environment, stdout: 'inherit', stderr: 'inherit',
  });
  activeChild = child;
  const code = await child.exited;
  activeChild = undefined;
  if (code !== 0) throw new Error(`${script} failed with exit code ${code}.`);
}

try {
  // These stub policy helpers are exclusively inside the newly-created test DB.
  await db.exec(`
    CREATE ROLE authenticated;
    CREATE SCHEMA private;
    CREATE FUNCTION private.current_user_id() RETURNS text LANGUAGE sql AS 'SELECT NULL::text';
    CREATE FUNCTION private.is_admin() RETURNS boolean LANGUAGE sql AS 'SELECT false';
  `);
  await server.start();
  started = true;
  console.log('Disposable socket ready at 127.0.0.1:55433/postgres; applying current Drizzle schema.');
  await run('db:push', '--config', './scripts/disposable-db.config.ts', '--force');
  await verifyDisposableSchema((sql, parameters) => db.query(sql, parameters));
  // All content is synthetic. No user accounts, credentials, or production rows.
  await db.exec(`
    INSERT INTO categories(id,name) VALUES('10000000-0000-4000-8000-000000000001','Test category');
    INSERT INTO authors(id,name) VALUES('10000000-0000-4000-8000-000000000002','Test author');
    INSERT INTO manga(id,slug,title,description,cover_image,pages,author_id,category_id)
      VALUES('10000000-0000-4000-8000-000000000003','disposable-build-fixture','Disposable build fixture',
        'Synthetic local test content','/mcp-test-cover.svg','["/mcp-test-cover.svg"]',
        '10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001');
    INSERT INTO advertisements(id,type,title,image_url,link_url,placement)
      VALUES('10000000-0000-4000-8000-000000000004','affiliate','Synthetic test advertisement',
        '/mcp-test-cover.svg','http://localhost:3101/?fixture-click=1','header');
  `);
  writeFileSync(join(directory, 'fixture.json'), JSON.stringify({
    databaseUrl: url, databasePath, environment: Object.fromEntries(Object.entries(environment).filter(([key]) =>
      ['DATABASE_URL', 'MAGGA_DISPOSABLE_DATABASE', 'BETTER_AUTH_SECRET', 'BETTER_AUTH_URL', 'NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_DEV_APP_URL', 'NEXT_TELEMETRY_DISABLED'].includes(key))),
    mangaId: '10000000-0000-4000-8000-000000000003',
    advertisementId: '10000000-0000-4000-8000-000000000004',
  }, null, 2), { flag: 'wx', mode: 0o600 });
  console.log(`Synthetic fixture parameters: ${join(directory, 'fixture.json')}`);
  if (!prepareOnly) {
    await run('build');
    console.log('Full Bun build passed against the fresh disposable test database.');
  }
  if (keepDatabase && !interrupted) {
    console.log('Database remains ready for local browser/API verification. Ctrl+C closes this fixture only.');
    await new Promise<void>(resolve => {
      resolveStop = resolve;
    });
  }
} finally {
  await close();
  process.removeListener('SIGINT', stop);
  process.removeListener('SIGTERM', stop);
}

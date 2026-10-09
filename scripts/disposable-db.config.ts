// Restricted to the two synthetic database endpoints used by local build and CI.
// This configuration never loads environment files or accepts production targets.
const url = process.env.DATABASE_URL;
if (!url) throw new Error('Disposable database URL required.');
const target = new URL(url);
const localFixture = target.port === '55433' && target.pathname === '/postgres';
const ciFixture = target.port === '5432' && target.pathname === '/magga_ci';
if (target.hostname !== '127.0.0.1' || (!localFixture && !ciFixture)
  || target.username !== 'postgres' || target.password !== 'postgres'
  || target.search || target.hash || !['postgres:', 'postgresql:'].includes(target.protocol)) {
  throw new Error('Only the approved synthetic loopback database endpoints are allowed.');
}

const disposableConfig = {
  schema: ['./db/schema.ts', './db/mcp-schema.ts', './db/comment-schema.ts', './scripts/disposable-schema.ts'],
  dialect: 'postgresql',
  schemaFilter: ['public', 'private'],
  dbCredentials: { url },
};

export default disposableConfig;

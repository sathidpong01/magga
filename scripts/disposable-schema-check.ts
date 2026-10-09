import postgres from 'postgres';

type SchemaQuery = (sql: string, parameters?: string[]) => Promise<{ rows: Record<string, unknown>[] }>;

// drizzle-kit 0.31 can report SQL failures while still exiting with code zero.
// Both build paths must verify the same cross-schema requirements independently.
export async function verifyDisposableSchema(query: SchemaQuery) {
  const requiredTables = ['private.comment_guests', 'private.comment_guest_sessions',
    'private.comment_rate_limits', 'private.comment_assets', 'private.comment_reports',
    'private.comment_moderation_events', 'public.comments', 'public.advertisement_events'];
  for (const table of requiredTables) {
    const result = await query('SELECT to_regclass($1)::text AS relation', [table]);
    if (!result.rows[0]?.relation) throw new Error(`Disposable schema incomplete: ${table}.`);
  }
  const constraints = await query(`SELECT count(*)::integer AS count FROM pg_constraint
    WHERE conrelid = 'public.comments'::regclass AND confrelid = 'private.comment_guests'::regclass
    AND contype = 'f' AND convalidated`);
  if (constraints.rows[0]?.count !== 1) throw new Error('Disposable guest comment foreign key missing.');
  await query('SELECT link_urls FROM public.advertisements LIMIT 0');
  console.log('Verified required public/private tables, guest foreign key, and advertisement link_urls.');
}

if (import.meta.main) {
  // Importing the config validates the exact synthetic loopback destination.
  const { default: disposableConfig } = await import('./disposable-db.config');
  const client = postgres(disposableConfig.dbCredentials.url, { max: 1, connect_timeout: 10 });
  try {
    await verifyDisposableSchema(async (sql, parameters) => ({ rows: await client.unsafe(sql, parameters ?? []) }));
  } finally {
    await client.end({ timeout: 5 });
  }
}

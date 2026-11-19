# Reader loading timeout — 2026-11-19

After v3.3.5 (`a0dda72`), public manga detail pages remained on their loading
skeletons across desktop and mobile browsers. Vercel production runtime logs
confirmed repeated 30-second function timeouts for multiple manga slugs.
An HTTP check reproduced a 504 `FUNCTION_INVOCATION_TIMEOUT`; the home page
and cached catalog responses still returned normally.

## Cause

The Postgres.js upgrade from 3.4.9 to 4.1.1 enabled a query execution pattern
incompatible with the project's Supabase transaction pooler on port 6543.
The reader loads author, contributor, category, tag and image-dimension data
with concurrent queries. Postgres.js can pipeline these onto an occupied
connection; this pooler can leave those queries unanswered.

Read-only comparisons against the same database isolated the behavior:

- Individual queries and the page list returned in approximately 0.07 seconds.
- The concurrent reader query group on the previous configuration stalled
  beyond the probe's 12-second deadline.
- The same group with `max_pipeline: 1` completed in approximately 0.27 seconds.
- The v3 driver completed the reader group in approximately 0.34 seconds.

Supabase documents that transaction pooling does not support query pipelining.
The Postgres.js 4.1.1 README specifically recommends `max_pipeline: 1` for
Supavisor versions affected by this hang. The deployed Supavisor version was
not inspected; the controlled comparison establishes the compatibility issue.

Sources:

- [Supabase connection modes and limitations](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Postgres.js 4.1.1 pooler guidance](https://github.com/porsager/postgres/blob/v4.1.1/README.md#connection-details)

## Correction and verification

The shared database factory sets `max_pipeline: 1`, retaining `prepare: false`
and the existing connection limits. Concurrent reads can still use separate
connections; multiple unfinished queries cannot share one connection. This
requires no schema change, environment-variable change, extra server function
or increase in the connection limit.

The regression test exercises the real database factory and Postgres.js client
through a loopback PostgreSQL protocol fixture that refuses a second query
until it has sent `ReadyForQuery`. Twelve concurrent reads exceed the
serverless pool's three connections. The test failed because the old client
configuration pipelined queries, then passed with the correction. It does not
require production credentials.

The earlier build/browser checks used a disposable direct PostgreSQL fixture
and therefore did not model the transaction pooler's protocol restriction.
Passing those checks did not establish production pooler compatibility.

After the correction, lint, TypeScript, all 736 tests across 99 files, and the
disposable production build passed. The built application was then run locally
with the production database configuration for read-only HTTP verification:
`one-night-stand-traffic`, `kimi-no-pantsu-wo-kagitai` and `midnight-laundry`
returned complete reader HTML with 24, 63 and 73 page elements respectively,
in approximately 0.91, 0.25 and 0.24 seconds. These were full page requests,
not only isolated SQL probes. No production deployment was performed during
this diagnosis; the hosted reader remains affected until the fix is released.

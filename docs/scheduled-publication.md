# Scheduled manga publication

Admins can create a scheduled manga, schedule an existing draft, change its time,
publish immediately, or cancel back to a draft from a separate scheduling dialog
opened by the manga form's secondary scheduling action. The normal save action
never applies an unconfirmed time entered in that dialog. Ordinary edits
preserve the database's current schedule and visibility. Explicit visibility
actions (including bulk show/hide) cancel the schedule. The admin list has a
scheduled filter and displays each scheduled instant in its creator's time zone.
User submissions retain the existing review flow.

The date picker uses the admin browser's IANA time zone (shown beside the field),
converts the chosen local minute to an absolute ISO instant, and stores it as
`scheduled_publish_at` (`timestamptz`) with `publication_time_zone`. Nonexistent
local times are rejected. During a repeated DST hour, the browser selects the
earlier occurrence; the confirmation text displays the selected UTC offset.
Changing the viewer's time zone does not move an existing scheduled instant.
There is no Facebook integration; admins schedule Facebook posts themselves.

`GET /api/admin/time` requires a fresh admin session and returns uncached server
time. The form compares future times against that clock plus monotonic elapsed
time; it does not trust the device's wall clock. The write API independently
rejects past times and invalid/missing time zones. The publishing worker uses
Postgres `now()` to determine which rows are due. Hosts should keep their clocks
synchronized. Scheduling requests that expire during a long upload fail safely
and can be retried with a later time.

Scheduled rows stay `is_hidden=true`, so existing public list, reader, search,
metadata, statistics, and comment access checks continue to hide them. The worker
publishes up to 100 due rows atomically with row locks and `SKIP LOCKED`, then
invalidates public caches. `created_at` is set to the scheduled release instant
when a scheduled work first becomes visible, so it appears among new releases.
Due timestamps remain until invalidation succeeds. Failed or interrupted runs
are retried, including when publication committed but cache invalidation failed.
Acknowledgements match the original timestamp and cannot clear a replacement
schedule. Retries do not reset the release date.

## Enable in an environment

1. Apply `db/migrations/0016_scheduled_manga_publication.sql` through the project's
   Drizzle migration workflow before deploying the application. It adds two
   nullable columns, a paired-null constraint, and a partial index. Existing rows
   retain their visibility. A disposable SQL-engine test executes this migration.
2. Set a strong `CRON_SECRET` in the target application's server environment.
3. Deploy the application and configure a caller to request
   `GET /api/cron/publish-manga` every minute with
   `Authorization: Bearer <CRON_SECRET>`. Do not put the secret in the URL.
   There is no browser timer or always-running process.

Vercel Hobby's native Cron runs at most daily with hourly precision, so the repo's
existing daily cleanup jobs are unchanged. Use Supabase Cron for minute-level
publishing, or another authenticated minute-level scheduler. Scheduling means
the first successful worker run at or after the chosen instant; it is not an
exact-second delivery guarantee. Outages and batches above 100 due works delay
publication. Jobs are caught up after recovery.

### Supabase Cron configuration

Enable **pg_cron**, **pg_net**, and **Vault** in the intended Supabase project.
Create these Vault secrets through the dashboard (keep actual values out of SQL
files, logs, and Git):

- `magga_publication_url`: the deployed canonical HTTPS URL ending in
  `/api/cron/publish-manga`.
- `magga_cron_secret`: the same value as the app's `CRON_SECRET`.

Then run this SQL in that project's SQL editor. Re-running the named schedule
updates it. It makes an HTTP request only when a due timestamp exists, including
pending cache acknowledgements, so idle minutes do not invoke the app.

```sql
select cron.schedule(
  'magga-publish-manga',
  '* * * * *',
  $job$
    select net.http_get(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'magga_publication_url'),
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'magga_cron_secret')
      ),
      timeout_milliseconds := 30000
    )
    where exists (select 1 from public.manga where scheduled_publish_at <= now());
  $job$
);
```

Check both `cron.job_run_details` and `net._http_response`: successful SQL job
execution only means the HTTP request was enqueued. Expect HTTP 200 with
`cacheRefreshPending=false`; 503 retains due timestamps for cache retries, and
500 retains unfinished work. Test with a synthetic scheduled draft, verify it is
absent publicly before its time and visible afterwards, and cancel another draft
to confirm it stays hidden. Pause with
`select cron.alter_job(job_id := (select jobid from cron.job where jobname = 'magga-publish-manga'), active := false);`.

Schema changes, deployments, Vault secrets, and Cron setup are environment
operations; adding this code does not configure a live scheduler automatically.

References: [Supabase Cron](https://supabase.com/docs/guides/cron),
[Cron quickstart](https://supabase.com/docs/guides/cron/quickstart),
[pg_net](https://supabase.com/docs/guides/database/extensions/pg_net),
[Vercel Cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).

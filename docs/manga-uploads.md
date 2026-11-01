# Manga uploads

Cover images and reader pages share local previews and a six-request upload queue. Files are sent only when saving. Invalid size/type selections leave the existing images unchanged. Selecting a batch containing an invalid file rejects the selection and lists the errors.

## Limits and validation

- JPEG, PNG, WebP, GIF and AVIF; non-empty files, at most 4 MiB each.
- The server decodes the image with Sharp, rejects damaged images and bounds decoding to 40 million pixels across frames. It stores the original bytes, including animation; it does not transcode or compress them.
- BMP is rejected because the installed image decoder does not support it.
- `POST /api/upload` requires authentication and one multipart `files` entry per request, plus a UUID `X-Upload-Id` header. The response remains `{ urls: [{ url, width, height }] }`.
- The request body is bounded while streaming to 4 MiB + 64 KiB for multipart overhead, below Vercel Functions' 4.5 MB payload limit. The former 64 MiB batch API is removed. The form already sends individual files.
- The per-user hourly request limit is 500 (members) or 1,000 (admins), including retries; unavailable rate-limit storage fails closed.

## Retries and storage lifetime

The form generates a stable UUID per selected file. The server scopes it to the authenticated user and records the content hash, storage key and URL before writing R2. A repeated request with the same ID and bytes reuses the same object and URL, even if the previous response was lost. Changing bytes or content type with the same ID returns 409. An upload retired by cleanup returns 410 and must be selected again. Reloading the form does not restore the selected files or IDs.

Unreferenced uploads expire seven days after their latest successful request. The existing authenticated daily `/api/cron/cleanup` retires and deletes up to 100 expired objects per call. If a backlog exists, repeat the cleanup endpoint to process additional batches. Uploads referenced by any manga (including drafts) or submission (including rejected submissions) are retained. Removing/replacing those references makes the old uploads eligible once their expiry has passed.

Database triggers lock ledger rows during manga/submission writes; cleanup uses the same row locks and rechecks references before retirement. Pending or retired URLs cannot be attached. This also protects writes from admin approval and other server tools. Failed or partially completed storage deletions retain retired records for the next cleanup. Tombstones remain after successful deletion to reject late retries/saves.

Cleanup only trusts server-generated keys in this ledger. It never deletes external URLs or historical uploads that predate the ledger. Existing historical orphans need a separate ownership inventory before deletion. A draft's public image URL is still publicly accessible if known; this change does not introduce private manga storage.

## Rollout

1. Apply `0017_manga_upload_lifecycle.sql` with the project's migration runner before deploying the matching application. No existing image/data backfill is required.
2. Deploy the updated client and server together. Older clients must reload because they do not send `X-Upload-Id`; API integrations must switch to one file per request.
3. Keep the existing daily cleanup cron enabled with `CRON_SECRET`. Storage failures return an error so the call can be retried.

Verification uses a disposable PostgreSQL-compatible database and in-memory storage for retry, reference protection and cleanup, plus real Sharp decodes. Production R2 and deployed cron require a live smoke check after rollout.

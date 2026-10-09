-- Backfill only when adding the column. Re-running must not resurrect cleared links.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'advertisements' AND column_name = 'link_urls'
  ) THEN
    ALTER TABLE "advertisements" ADD COLUMN "link_urls" jsonb NOT NULL DEFAULT '[]'::jsonb;
    -- Conservative HTTP(S) backfill. Keep link_url byte-for-byte, including unsupported legacy data.
    UPDATE "advertisements"
    SET "link_urls" = jsonb_build_array(btrim("link_url"))
    WHERE btrim("link_url") ~* '^https?://([a-z0-9]([a-z0-9.-]*[a-z0-9])?|\[[0-9a-f:]+\])(:[0-9]{1,5})?([/?#][^[:space:]\\]*)?$'
      AND length(btrim("link_url")) <= 2048
      AND btrim("link_url") !~ '[[:cntrl:]]';
  END IF;
END $$;

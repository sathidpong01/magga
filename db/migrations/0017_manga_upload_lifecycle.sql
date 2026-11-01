CREATE TABLE public.manga_uploads (
  user_id text NOT NULL,
  upload_id uuid NOT NULL,
  object_key text NOT NULL UNIQUE,
  url text NOT NULL UNIQUE,
  content_hash text NOT NULL,
  content_type text NOT NULL,
  bytes integer NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'ready', 'retired')),
  expires_at timestamptz NOT NULL,
  removed_at timestamptz,
  PRIMARY KEY (user_id, upload_id)
);
ALTER TABLE public.manga_uploads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.manga_uploads FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public.manga_uploads FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public.manga_uploads FROM authenticated;
  END IF;
END $$;
CREATE INDEX idx_manga_uploads_cleanup ON public.manga_uploads(expires_at) WHERE removed_at IS NULL;

-- Lock the same ledger rows as cleanup so a save cannot attach an object being retired.
-- Existing/external URLs have no ledger row and are never cleanup targets.
CREATE FUNCTION public.guard_manga_upload_references() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE asset record;
BEGIN
  FOR asset IN
    SELECT state FROM public.manga_uploads
    WHERE url IN (
      SELECT NEW.cover_image
      UNION ALL
      SELECT CASE WHEN jsonb_typeof(page) = 'string' THEN page #>> '{}' ELSE page ->> 'url' END
      FROM jsonb_array_elements(NEW.pages::jsonb) AS page
    )
    ORDER BY object_key FOR UPDATE
  LOOP
    IF asset.state <> 'ready' THEN
      RAISE EXCEPTION 'Upload is not available; select the file again' USING ERRCODE = '23514';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_manga_upload_references() FROM PUBLIC;
CREATE TRIGGER manga_upload_references BEFORE INSERT OR UPDATE OF cover_image, pages ON public.manga
FOR EACH ROW EXECUTE FUNCTION public.guard_manga_upload_references();
CREATE TRIGGER submission_upload_references BEFORE INSERT OR UPDATE OF cover_image, pages ON public.manga_submissions
FOR EACH ROW EXECUTE FUNCTION public.guard_manga_upload_references();

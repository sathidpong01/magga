ALTER TABLE public.manga ADD COLUMN publication_date_set boolean NOT NULL DEFAULT true;
--> statement-breakpoint
-- Preserve every legacy row's ordering; visibility history before this migration is unknown.
ALTER TABLE public.manga ALTER COLUMN publication_date_set SET DEFAULT false;
--> statement-breakpoint
CREATE FUNCTION private.set_manga_publication_date() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.publication_date_set := NOT NEW.is_hidden;
  ELSIF OLD.publication_date_set THEN
    NEW.publication_date_set := true;
    NEW.created_at := OLD.created_at;
  ELSIF NOT NEW.is_hidden THEN
    NEW.publication_date_set := true;
    NEW.created_at := COALESCE(NEW.scheduled_publish_at, pg_catalog.now());
  ELSE
    NEW.publication_date_set := false;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER manga_publication_date
BEFORE INSERT OR UPDATE OF is_hidden ON public.manga
FOR EACH ROW EXECUTE FUNCTION private.set_manga_publication_date();

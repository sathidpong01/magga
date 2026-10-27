-- Additive migration. No historical daily counts can be inferred from view_count.
CREATE TABLE public.manga_view_tracking (
  manga_id uuid PRIMARY KEY REFERENCES public.manga(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  baseline_views bigint NOT NULL DEFAULT 0
);
CREATE TABLE public.manga_view_daily (
  manga_id uuid NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  day date NOT NULL,
  views bigint NOT NULL DEFAULT 0,
  hours jsonb NOT NULL DEFAULT '{}',
  PRIMARY KEY(manga_id, day),
  CONSTRAINT manga_view_daily_views_check CHECK(views >= 0)
);
ALTER TABLE public.manga_view_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manga_view_daily ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.manga_view_tracking, public.manga_view_daily FROM PUBLIC;
DO $$ DECLARE role_name text; BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF EXISTS(SELECT FROM pg_roles WHERE rolname=role_name) THEN
      EXECUTE format('REVOKE ALL ON public.manga_view_tracking, public.manga_view_daily FROM %I', role_name);
    END IF;
  END LOOP;
END $$;

INSERT INTO public.manga_view_tracking(manga_id, baseline_views)
SELECT id, view_count FROM public.manga;

-- Runs in the same transaction as the deduplicated lifetime increment.
-- One row per active work/day, no visitor identifiers or per-visit event log.
CREATE FUNCTION public.capture_manga_view_history() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE delta bigint; local_time timestamp; hour_key text;
BEGIN
  IF TG_OP='INSERT' THEN
    INSERT INTO public.manga_view_tracking(manga_id,baseline_views)
    VALUES(NEW.id,NEW.view_count) ON CONFLICT DO NOTHING;
    RETURN NEW;
  END IF;
  delta := NEW.view_count - OLD.view_count;
  IF delta <= 0 THEN RETURN NEW; END IF;
  local_time := statement_timestamp() AT TIME ZONE 'Asia/Bangkok';
  hour_key := extract(hour FROM local_time)::int::text;
  INSERT INTO public.manga_view_daily AS daily(manga_id,day,views,hours)
  VALUES(NEW.id,local_time::date,delta,jsonb_build_object(hour_key,delta))
  ON CONFLICT(manga_id,day) DO UPDATE SET
    views=daily.views+delta,
    hours=jsonb_set(daily.hours,ARRAY[hour_key],to_jsonb(coalesce((daily.hours->>hour_key)::bigint,0)+delta),true);
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.capture_manga_view_history() FROM PUBLIC;
CREATE TRIGGER manga_view_history_capture AFTER INSERT OR UPDATE OF view_count ON public.manga
FOR EACH ROW EXECUTE FUNCTION public.capture_manga_view_history();

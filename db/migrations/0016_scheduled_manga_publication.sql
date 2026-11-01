ALTER TABLE public.manga ADD COLUMN scheduled_publish_at timestamptz;
ALTER TABLE public.manga ADD COLUMN publication_time_zone text;
ALTER TABLE public.manga ADD CONSTRAINT manga_publication_schedule_check
  CHECK ((scheduled_publish_at IS NULL) = (publication_time_zone IS NULL));
CREATE INDEX idx_manga_scheduled_publish ON public.manga(scheduled_publish_at)
  WHERE scheduled_publish_at IS NOT NULL;

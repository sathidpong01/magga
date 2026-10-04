ALTER TABLE public.advertisements
  ADD COLUMN target_device text NOT NULL DEFAULT 'all',
  ADD COLUMN impressions bigint NOT NULL DEFAULT 0,
  ADD COLUMN clicks bigint NOT NULL DEFAULT 0,
  ADD CONSTRAINT advertisements_device_check CHECK (target_device IN ('all', 'mobile', 'desktop'));--> statement-breakpoint

CREATE TABLE public.advertisement_events (
  event_id uuid NOT NULL,
  ad_id uuid NOT NULL REFERENCES public.advertisements(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('impression', 'click')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, kind)
);--> statement-breakpoint
CREATE INDEX advertisement_events_ad_idx ON public.advertisement_events(ad_id);--> statement-breakpoint
CREATE INDEX advertisement_events_created_idx ON public.advertisement_events(created_at);--> statement-breakpoint
ALTER TABLE public.advertisement_events ENABLE ROW LEVEL SECURITY;

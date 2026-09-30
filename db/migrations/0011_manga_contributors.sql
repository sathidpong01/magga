CREATE TABLE IF NOT EXISTS public.manga_contributors (
  manga_id uuid NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.authors(id) ON DELETE CASCADE,
  role text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  PRIMARY KEY (manga_id, author_id)
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_manga_contributors_author
  ON public.manga_contributors (author_id);--> statement-breakpoint

ALTER TABLE public.manga_contributors ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

DROP POLICY IF EXISTS manga_contributors_select ON public.manga_contributors;--> statement-breakpoint
CREATE POLICY manga_contributors_select ON public.manga_contributors
  FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM public.manga m
    WHERE m.id = manga_id
      AND (m.is_hidden = false OR (SELECT private.is_admin()))
  ));--> statement-breakpoint
DROP POLICY IF EXISTS manga_contributors_admin_write ON public.manga_contributors;--> statement-breakpoint
CREATE POLICY manga_contributors_admin_write ON public.manga_contributors
  FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_admin()));--> statement-breakpoint
DROP POLICY IF EXISTS manga_contributors_admin_update ON public.manga_contributors;--> statement-breakpoint
CREATE POLICY manga_contributors_admin_update ON public.manga_contributors
  FOR UPDATE TO authenticated USING ((SELECT private.is_admin()));--> statement-breakpoint
DROP POLICY IF EXISTS manga_contributors_admin_delete ON public.manga_contributors;--> statement-breakpoint
CREATE POLICY manga_contributors_admin_delete ON public.manga_contributors
  FOR DELETE TO authenticated USING ((SELECT private.is_admin()));

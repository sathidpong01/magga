-- Better Auth 1.7 validates the Drizzle schema used by enabled plugins at
-- runtime. These nullable columns preserve existing users and sessions while
-- enabling the admin and username plugins.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_username text,
  ADD COLUMN IF NOT EXISTS ban_expires timestamp with time zone;
--> statement-breakpoint
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS impersonated_by text;
--> statement-breakpoint
-- Preserve the display value for accounts created before the plugin added a
-- separate normalized/display username pair.
UPDATE public.profiles
SET display_username = username
WHERE display_username IS NULL
  AND username IS NOT NULL;

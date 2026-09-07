-- The application accesses Postgres from trusted server code, not from the
-- Supabase Data API. Keep the Better Auth profile table private even if an RLS
-- policy is accidentally loosened later.
REVOKE ALL PRIVILEGES ON TABLE public.profiles FROM anon, authenticated;

-- Preserve the legacy Supabase Auth trigger for compatibility, but never trust
-- user-controlled metadata for authorization fields.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id,
    name,
    email,
    image,
    username,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name'
    ),
    NEW.email,
    NEW.raw_user_meta_data ->> 'avatar_url',
    COALESCE(
      NEW.raw_user_meta_data ->> 'username',
      pg_catalog.split_part(NEW.email, '@', 1)
    ),
    'user',
    pg_catalog.now(),
    pg_catalog.now()
  );
  RETURN NEW;
END;
$function$;

REVOKE ALL PRIVILEGES ON FUNCTION public.handle_new_user()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

CREATE OR REPLACE FUNCTION public.increment_view_count(manga_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.manga
  SET view_count = view_count + 1
  WHERE id = manga_id;
END;
$function$;

REVOKE ALL PRIVILEGES ON FUNCTION public.increment_view_count(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_view_count(uuid) TO service_role;

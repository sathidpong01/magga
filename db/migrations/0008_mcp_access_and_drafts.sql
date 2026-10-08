-- Custom SQL migration file, put your code below! --
CREATE TABLE public.mcp_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id text NOT NULL CONSTRAINT mcp_api_keys_owner_user_id_profiles_id_fk REFERENCES public.profiles(id),
  name text NOT NULL, key_prefix text NOT NULL, secret_hash text NOT NULL CONSTRAINT mcp_api_keys_secret_hash_unique UNIQUE,
  scopes text[] NOT NULL,
  expires_at timestamptz NOT NULL, revoked_at timestamptz, last_used_at timestamptz,
  window_start timestamptz NOT NULL DEFAULT now(), request_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (secret_hash ~ '^[a-f0-9]{64}$'),
  CHECK (scopes <@ ARRAY['catalog:read','research:read','draft:write','metadata:write']::text[])
);
--> statement-breakpoint
CREATE TABLE public.mcp_metadata_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('author_links','manga_tags','manga_metadata')),
  target_type text NOT NULL CHECK (target_type IN ('author','manga')), target_id uuid NOT NULL,
  payload jsonb NOT NULL, sources jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','applied','rejected')),
  requesting_key_id uuid NOT NULL CONSTRAINT mcp_metadata_drafts_requesting_key_id_mcp_api_keys_id_fk REFERENCES public.mcp_api_keys(id),
  reviewer_user_id text CONSTRAINT mcp_metadata_drafts_reviewer_user_id_profiles_id_fk REFERENCES public.profiles(id), review_note text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE public.mcp_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_id uuid NOT NULL,
  key_id uuid NOT NULL CONSTRAINT mcp_audit_events_key_id_mcp_api_keys_id_fk REFERENCES public.mcp_api_keys(id),
  owner_user_id text NOT NULL CONSTRAINT mcp_audit_events_owner_user_id_profiles_id_fk REFERENCES public.profiles(id),
  tool_name text NOT NULL, outcome text NOT NULL CHECK (outcome IN ('started','success','failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mcp_audit_request_idx ON public.mcp_audit_events(request_id);
--> statement-breakpoint
ALTER TABLE public.mcp_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_metadata_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_audit_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mcp_api_keys, public.mcp_metadata_drafts, public.mcp_audit_events FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
CREATE FUNCTION public.mcp_reject_audit_mutation() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN RAISE EXCEPTION 'MCP audit events are append-only'; END;
$$;
REVOKE ALL ON FUNCTION public.mcp_reject_audit_mutation() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER mcp_audit_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON public.mcp_audit_events
FOR EACH STATEMENT EXECUTE FUNCTION public.mcp_reject_audit_mutation();

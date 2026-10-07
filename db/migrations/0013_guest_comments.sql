-- Additive guest comments; no existing comment or vote data is deleted.
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE private.comment_guests (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), public_code text NOT NULL UNIQUE, name text NOT NULL, is_banned boolean NOT NULL DEFAULT false, ban_reason text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE private.comment_guest_sessions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), guest_id uuid NOT NULL REFERENCES private.comment_guests(id) ON DELETE CASCADE, token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'), expires_at timestamptz NOT NULL, revoked_at timestamptz, verified_until timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX comment_guest_sessions_guest_idx ON private.comment_guest_sessions(guest_id);
CREATE INDEX comment_guest_sessions_expiry_idx ON private.comment_guest_sessions(expires_at);
CREATE TABLE private.comment_rate_limits (key text PRIMARY KEY, window_start timestamptz NOT NULL, count integer NOT NULL DEFAULT 0, bytes bigint NOT NULL DEFAULT 0, expires_at timestamptz NOT NULL, CONSTRAINT comment_rate_limits_nonnegative CHECK (count >= 0 AND bytes >= 0));
CREATE INDEX comment_rate_limits_expiry_idx ON private.comment_rate_limits(expires_at);
ALTER TABLE public.comments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.comments ADD COLUMN guest_id uuid REFERENCES private.comment_guests(id), ADD COLUMN author_name text, ADD COLUMN guest_public_code text, ADD COLUMN status text NOT NULL DEFAULT 'published', ADD COLUMN idempotency_key text, ADD COLUMN request_hash text;
ALTER TABLE public.comments ADD CONSTRAINT comments_owner_check CHECK (num_nonnulls(user_id,guest_id)=1), ADD CONSTRAINT comments_status_check CHECK (status IN ('published','pending','hidden','deleted'));
CREATE UNIQUE INDEX comments_member_idempotency_key ON public.comments(user_id,idempotency_key) WHERE user_id IS NOT NULL AND idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX comments_guest_idempotency_key ON public.comments(guest_id,idempotency_key) WHERE guest_id IS NOT NULL AND idempotency_key IS NOT NULL;
-- Soft delete handles removal. Prevent accidental physical deletion of a parent thread.
ALTER TABLE public.comments DROP CONSTRAINT comments_parent_id_fkey;
ALTER TABLE public.comments ADD CONSTRAINT comments_parent_id_fkey FOREIGN KEY(parent_id) REFERENCES public.comments(id) ON DELETE RESTRICT;
CREATE INDEX idx_comments_guest ON public.comments(guest_id);
CREATE INDEX idx_comments_status_created ON public.comments(status,created_at,id);
CREATE TABLE private.comment_assets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id text REFERENCES public.profiles(id), guest_id uuid REFERENCES private.comment_guests(id), object_key text NOT NULL UNIQUE, content_type text NOT NULL, bytes bigint NOT NULL, width integer NOT NULL, height integer NOT NULL, state text NOT NULL DEFAULT 'staged', expires_at timestamptz NOT NULL, comment_id uuid REFERENCES public.comments(id) ON DELETE SET NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT comment_assets_owner_check CHECK(num_nonnulls(user_id,guest_id)=1), CONSTRAINT comment_assets_state_check CHECK(state IN ('staged','reserved','published','deleted')), CONSTRAINT comment_assets_dimensions_check CHECK(width>0 AND height>0 AND bytes>0));
CREATE INDEX comment_assets_owner_guest_idx ON private.comment_assets(guest_id,state);
CREATE INDEX comment_assets_owner_user_idx ON private.comment_assets(user_id,state);
CREATE INDEX comment_assets_comment_idx ON private.comment_assets(comment_id);
CREATE INDEX comment_assets_expiry_idx ON private.comment_assets(expires_at);
CREATE TABLE private.comment_reports (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), comment_id uuid NOT NULL REFERENCES public.comments(id), user_id text REFERENCES public.profiles(id), guest_id uuid REFERENCES private.comment_guests(id), reason text NOT NULL, details text, status text NOT NULL DEFAULT 'open', reviewer_user_id text REFERENCES public.profiles(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT comment_reports_owner_check CHECK(num_nonnulls(user_id,guest_id)=1), CONSTRAINT comment_reports_reason_check CHECK(reason IN ('spam','abuse','image','other')), CONSTRAINT comment_reports_status_check CHECK(status IN ('open','resolved','dismissed')));
CREATE UNIQUE INDEX comment_reports_member_unique ON private.comment_reports(comment_id,user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX comment_reports_guest_unique ON private.comment_reports(comment_id,guest_id) WHERE guest_id IS NOT NULL;
CREATE INDEX comment_reports_status_idx ON private.comment_reports(status,created_at);
CREATE TABLE private.comment_moderation_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_user_id text NOT NULL REFERENCES public.profiles(id), comment_id uuid REFERENCES public.comments(id), guest_id uuid REFERENCES private.comment_guests(id), report_id uuid REFERENCES private.comment_reports(id), action text NOT NULL, reason text, created_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT comment_moderation_events_action_check CHECK(action IN ('hide','publish','delete','ban-guest','unban-guest','resolve-report','dismiss-report')));
CREATE INDEX comment_moderation_events_comment_idx ON private.comment_moderation_events(comment_id);
ALTER TABLE private.comment_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.comment_guest_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.comment_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.comment_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.comment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.comment_moderation_events ENABLE ROW LEVEL SECURITY;
-- Application access uses server Drizzle only. Revoke PUBLIC inheritance as well.
REVOKE ALL ON TABLE private.comment_guests,private.comment_guest_sessions,private.comment_rate_limits,private.comment_assets,private.comment_reports,private.comment_moderation_events FROM PUBLIC,anon,authenticated;
REVOKE ALL ON TABLE public.comments,public.comment_votes FROM PUBLIC,anon,authenticated;

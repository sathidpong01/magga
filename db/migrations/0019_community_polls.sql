-- Additive poll module. All writes and private reads go through server-side Auth Intake.
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE private.polls (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text NOT NULL DEFAULT '', creator_id text NOT NULL,
 status text NOT NULL DEFAULT 'draft' CONSTRAINT poll_status_check CHECK(status IN ('draft','published','paused','closed','archived')),
 visibility text NOT NULL DEFAULT 'public' CONSTRAINT poll_visibility_check CHECK(visibility IN ('public','unlisted')),
 results_visibility text NOT NULL DEFAULT 'after_vote' CONSTRAINT poll_results_check CHECK(results_visibility IN ('public','after_vote','after_close','admin')),
 security text NOT NULL DEFAULT 'standard' CONSTRAINT poll_security_check CHECK(security IN ('standard','ip','members')),
 min_choices integer NOT NULL DEFAULT 1, max_choices integer NOT NULL DEFAULT 1,
 allow_change boolean NOT NULL DEFAULT false, show_count boolean NOT NULL DEFAULT true, show_on_home boolean NOT NULL DEFAULT true, pinned boolean NOT NULL DEFAULT false,
 starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL, published_at timestamptz, version integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT poll_choices_check CHECK(min_choices>=1 AND max_choices>=min_choices AND max_choices<=30), CONSTRAINT poll_time_check CHECK(ends_at>starts_at)
);
CREATE INDEX poll_home_idx ON private.polls(status,visibility,show_on_home,starts_at,ends_at);
CREATE TABLE private.poll_assets(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), creator_id text NOT NULL, object_key text NOT NULL UNIQUE, url text NOT NULL, bytes integer NOT NULL, width integer NOT NULL, height integer NOT NULL, state text NOT NULL DEFAULT 'staged' CONSTRAINT poll_asset_state_check CHECK(state IN ('staged','published','retired')), expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX poll_assets_cleanup_idx ON private.poll_assets(state,expires_at);
ALTER TABLE private.polls ADD COLUMN cover_asset_id uuid REFERENCES private.poll_assets(id);
CREATE TABLE private.poll_options(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), poll_id uuid NOT NULL REFERENCES private.polls(id) ON DELETE CASCADE, label text NOT NULL, position integer NOT NULL, asset_id uuid REFERENCES private.poll_assets(id), CONSTRAINT poll_options_poll_id_id_key UNIQUE(poll_id,id));
CREATE INDEX poll_options_order_idx ON private.poll_options(poll_id,position);
ALTER TABLE private.poll_options ADD COLUMN manga_id uuid;
CREATE TABLE private.poll_sessions(token_hash text PRIMARY KEY, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX poll_sessions_expiry_idx ON private.poll_sessions(expires_at);
CREATE TABLE private.poll_ballots(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), poll_id uuid NOT NULL REFERENCES private.polls(id), status text NOT NULL DEFAULT 'counted' CONSTRAINT poll_ballot_status_check CHECK(status IN ('counted','excluded')), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT poll_ballots_id_poll_id_key UNIQUE(id,poll_id));
CREATE INDEX poll_ballots_poll_idx ON private.poll_ballots(poll_id,status,created_at);
CREATE TABLE private.poll_ballot_choices(ballot_id uuid NOT NULL, poll_id uuid NOT NULL, option_id uuid NOT NULL, PRIMARY KEY(ballot_id,option_id), FOREIGN KEY(ballot_id,poll_id) REFERENCES private.poll_ballots(id,poll_id) ON DELETE CASCADE, FOREIGN KEY(poll_id,option_id) REFERENCES private.poll_options(poll_id,id));
CREATE INDEX poll_choices_option_idx ON private.poll_ballot_choices(poll_id,option_id);
CREATE TABLE private.poll_claims(poll_id uuid NOT NULL, claim text NOT NULL, ballot_id uuid NOT NULL, PRIMARY KEY(poll_id,claim), FOREIGN KEY(ballot_id,poll_id) REFERENCES private.poll_ballots(id,poll_id) ON DELETE CASCADE);
CREATE TABLE private.poll_requests(poll_id uuid NOT NULL, actor text NOT NULL, request_id uuid NOT NULL, payload text NOT NULL, ballot_id uuid NOT NULL REFERENCES private.poll_ballots(id), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(poll_id,actor,request_id));
CREATE TABLE private.poll_audit_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), poll_id uuid NOT NULL REFERENCES private.polls(id), actor_id text NOT NULL, action text NOT NULL, reason text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX poll_audit_poll_idx ON private.poll_audit_events(poll_id,created_at);
CREATE TABLE private.poll_limits(key text PRIMARY KEY, count integer NOT NULL, expires_at timestamptz NOT NULL);
CREATE INDEX poll_limits_expiry_idx ON private.poll_limits(expires_at);
CREATE TABLE private.poll_security_counts(poll_id uuid NOT NULL REFERENCES private.polls(id),hour timestamptz NOT NULL,reason text NOT NULL,count integer NOT NULL DEFAULT 1,PRIMARY KEY(poll_id,hour,reason));
ALTER TABLE private.poll_security_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.poll_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.poll_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.poll_ballots ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.poll_ballot_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.poll_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.poll_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.poll_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.poll_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.polls,private.poll_assets,private.poll_options,private.poll_sessions,private.poll_ballots,private.poll_ballot_choices,private.poll_claims,private.poll_requests,private.poll_audit_events,private.poll_limits FROM PUBLIC, anon, authenticated;
REVOKE ALL ON private.poll_security_counts FROM PUBLIC, anon, authenticated;

-- Compatible expansion only; catalog rows and existing draft payloads stay unchanged.
ALTER TABLE public.mcp_metadata_drafts DROP CONSTRAINT mcp_metadata_drafts_kind_check;
--> statement-breakpoint
ALTER TABLE public.mcp_metadata_drafts ADD CONSTRAINT mcp_metadata_drafts_kind_check
  CHECK (kind IN ('author_links','manga_tags','manga_metadata','manga_author'));

-- Preserve the exact subset approved from a larger MCP proposal.
ALTER TABLE public.mcp_metadata_drafts
  ADD COLUMN decision_payload jsonb;

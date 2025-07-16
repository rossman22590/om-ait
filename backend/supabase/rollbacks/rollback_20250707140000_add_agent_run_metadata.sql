BEGIN;

-- Rollback: Remove metadata column from agent_runs table
ALTER TABLE agent_runs DROP COLUMN IF EXISTS metadata;

-- Drop the GIN index for metadata column
DROP INDEX IF EXISTS idx_agent_runs_metadata;

COMMIT; 
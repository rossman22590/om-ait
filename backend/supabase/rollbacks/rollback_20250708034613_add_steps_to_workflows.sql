BEGIN;

-- Rollback: Remove steps column from agent_workflows table
ALTER TABLE agent_workflows DROP COLUMN IF EXISTS steps;

-- Drop the GIN index for steps column
DROP INDEX IF EXISTS idx_agent_workflows_steps;

COMMIT; 
BEGIN;

-- Remove the is_kortix_team column from agent_templates table
ALTER TABLE agent_templates DROP COLUMN IF EXISTS is_kortix_team;

-- Drop the index
DROP INDEX IF EXISTS idx_agent_templates_is_kortix_team;

COMMIT; 
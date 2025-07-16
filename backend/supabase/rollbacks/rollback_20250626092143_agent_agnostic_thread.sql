BEGIN;

-- Remove the agent version tracking columns from agent_runs table
ALTER TABLE agent_runs 
DROP COLUMN IF EXISTS agent_id,
DROP COLUMN IF EXISTS agent_version_id;

-- Remove the agent version tracking columns from messages table
ALTER TABLE messages 
DROP COLUMN IF EXISTS agent_version_id;

-- Note: The messages.agent_id column was already added in 20250601000000_add_thread_metadata.sql
-- so we don't drop it here to avoid conflicts

-- Drop the indexes
DROP INDEX IF EXISTS idx_messages_agent_version_id;
DROP INDEX IF EXISTS idx_agent_runs_agent_id;
DROP INDEX IF EXISTS idx_agent_runs_agent_version_id;

COMMIT; 
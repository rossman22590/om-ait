BEGIN;

-- Remove the metadata column from threads table
ALTER TABLE threads DROP COLUMN IF EXISTS metadata;

-- Remove the agent_id column from messages table
ALTER TABLE messages DROP COLUMN IF EXISTS agent_id;

-- Drop the indexes
DROP INDEX IF EXISTS idx_threads_metadata;
DROP INDEX IF EXISTS idx_messages_agent_id;

COMMIT; 
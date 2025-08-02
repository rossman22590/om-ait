-- ROLLBACK: 20250726224819_reverse_move_agent_fields_to_metadata.sql
-- Moves agent_id and agent_version_id from columns back to metadata

BEGIN;

-- Move data from columns to metadata
UPDATE threads 
SET metadata = COALESCE(metadata, '{}'::jsonb) || 
    jsonb_build_object(
        'agent_id', agent_id::text,
        'agent_version_id', agent_version_id::text
    )
WHERE agent_id IS NOT NULL OR agent_version_id IS NOT NULL;

-- Drop foreign key constraints
ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_agent_id_fkey;

-- Drop indexes
DROP INDEX IF EXISTS idx_threads_agent_id;
DROP INDEX IF EXISTS idx_threads_agent_version_id;

-- Remove the columns
ALTER TABLE threads DROP COLUMN IF EXISTS agent_id;
ALTER TABLE threads DROP COLUMN IF EXISTS agent_version_id;

COMMIT;

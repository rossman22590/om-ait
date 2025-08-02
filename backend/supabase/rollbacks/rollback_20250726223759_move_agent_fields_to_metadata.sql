-- ROLLBACK: 20250726223759_move_agent_fields_to_metadata.sql
-- Moves agent_id and agent_version_id from metadata back to columns

BEGIN;

-- Add the columns back
ALTER TABLE threads ADD COLUMN IF NOT EXISTS agent_id UUID;
ALTER TABLE threads ADD COLUMN IF NOT EXISTS agent_version_id UUID;

-- Move data from metadata back to columns
UPDATE threads 
SET 
    agent_id = (metadata->>'agent_id')::UUID,
    agent_version_id = (metadata->>'agent_version_id')::UUID
WHERE metadata ? 'agent_id' OR metadata ? 'agent_version_id';

-- Remove agent fields from metadata
UPDATE threads 
SET metadata = metadata - 'agent_id' - 'agent_version_id'
WHERE metadata ? 'agent_id' OR metadata ? 'agent_version_id';

-- Recreate foreign key constraints (if agents table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agents') THEN
        ALTER TABLE threads ADD CONSTRAINT threads_agent_id_fkey 
        FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE SET NULL;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        -- Constraint already exists, ignore
        NULL;
END $$;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_threads_agent_id ON threads(agent_id);
CREATE INDEX IF NOT EXISTS idx_threads_agent_version_id ON threads(agent_version_id);

COMMIT;

-- ROLLBACK: 20250726200404_remove_agent_cols_from_threads.sql
-- WARNING: This rollback cannot restore the dropped data!
-- The agent_id and agent_version_id columns were permanently deleted.

BEGIN;

-- WARNING: DATA LOSS OCCURRED - CANNOT BE FULLY ROLLED BACK
-- This migration permanently deleted:
-- - agent_id column from threads table
-- - agent_version_id column from threads table

-- We can recreate the columns, but the data is permanently lost

-- Restore agent_id column (data will be NULL)
ALTER TABLE threads ADD COLUMN IF NOT EXISTS agent_id UUID;

-- Restore agent_version_id column (data will be NULL)
ALTER TABLE threads ADD COLUMN IF NOT EXISTS agent_version_id UUID;

-- Recreate foreign key constraints (if agents table still exists)
-- Note: These may fail if the referenced tables don't exist
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

-- Note: This rollback only restores column structures, not data
-- Manual data restoration from backup is required if data recovery is needed

COMMIT;

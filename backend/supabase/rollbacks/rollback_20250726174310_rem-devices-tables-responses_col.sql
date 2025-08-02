-- ROLLBACK: 20250726174310_rem-devices-tables-responses_col.sql
-- WARNING: This rollback cannot restore the dropped data!
-- The recordings and devices tables were permanently deleted.

BEGIN;

-- WARNING: DATA LOSS OCCURRED - CANNOT BE FULLY ROLLED BACK
-- This migration permanently deleted:
-- - recordings table
-- - devices table  
-- - responses column from agent_runs

-- We can recreate the table structures, but the data is permanently lost
-- unless you have a separate backup

-- Recreate recordings table structure (data will be empty)
CREATE TABLE IF NOT EXISTS recordings (
    recording_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Add other columns as needed - structure unknown without original schema
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recreate devices table structure (data will be empty)
CREATE TABLE IF NOT EXISTS devices (
    device_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Add other columns as needed - structure unknown without original schema
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restore responses column to agent_runs (data will be NULL)
ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS responses JSONB;

-- Note: This rollback only restores table structures, not data
-- Manual data restoration from backup is required if data recovery is needed

COMMIT;

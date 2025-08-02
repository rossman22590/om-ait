-- ROLLBACK: 20250723181204_restore_avatar_columns.sql
-- Removes avatar columns from agents table

BEGIN;

-- Drop indexes
DROP INDEX IF EXISTS idx_agents_avatar;
DROP INDEX IF EXISTS idx_agents_avatar_color;

-- Remove avatar columns
ALTER TABLE agents DROP COLUMN IF EXISTS avatar;
ALTER TABLE agents DROP COLUMN IF EXISTS avatar_color;

-- Note: The original data should still exist in config.metadata if it was migrated from there

COMMIT;

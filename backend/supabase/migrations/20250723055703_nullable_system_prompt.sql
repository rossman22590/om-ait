-- This migration attempts to make system_prompt nullable, 
-- but the column has been migrated to config field in the cleanup migration
-- This migration is now obsolete and can be skipped

-- The system_prompt column has been moved to config->'system_prompt' 
-- in the cleanup_agents_table migration, so this migration is no longer needed

-- Select 1 to indicate migration completed successfully
SELECT 1 AS migration_skipped_column_already_dropped; 
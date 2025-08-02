-- ROLLBACK: 20250728193819_fix_templates.sql
-- Reverts agent_templates config migration using backup

BEGIN;

-- Check if backup table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agent_templates_backup_20250728') THEN
        RAISE EXCEPTION 'Backup table agent_templates_backup_20250728 not found. Cannot rollback safely.';
    END IF;
END $$;

-- Drop the sanitization function
DROP FUNCTION IF EXISTS sanitize_agent_template_config(JSONB);

-- Restore original config structure from backup
UPDATE agent_templates 
SET config = backup.config
FROM agent_templates_backup_20250728 backup
WHERE agent_templates.template_id = backup.template_id;

-- Drop indexes created for new structure
DROP INDEX IF EXISTS idx_agent_templates_config_system_prompt;
DROP INDEX IF EXISTS idx_agent_templates_config_tools;
DROP INDEX IF EXISTS idx_agent_templates_config_metadata;

-- Recreate indexes for original structure (if they existed)
-- Note: Original index structure may need to be adjusted based on original schema

-- Note: Backup table is kept for safety - remove manually if desired
-- DROP TABLE IF EXISTS agent_templates_backup_20250728;

COMMIT;

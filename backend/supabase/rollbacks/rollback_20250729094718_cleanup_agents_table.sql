-- ROLLBACK: 20250729094718_cleanup_agents_table.sql
-- Restores dropped columns from agents table using backup

BEGIN;

-- Check if backup table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agents_backup_cleanup_20250729') THEN
        RAISE EXCEPTION 'Backup table agents_backup_cleanup_20250729 not found. Cannot rollback safely.';
    END IF;
END $$;

-- Restore dropped columns
ALTER TABLE agents ADD COLUMN IF NOT EXISTS marketplace_published_at TIMESTAMPTZ;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;

-- Restore data from backup table
UPDATE agents 
SET 
    marketplace_published_at = backup.marketplace_published_at,
    download_count = backup.download_count,
    config = backup.config
FROM agents_backup_cleanup_20250729 backup
WHERE agents.agent_id = backup.agent_id;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_agents_marketplace_published_at ON agents(marketplace_published_at);
CREATE INDEX IF NOT EXISTS idx_agents_download_count ON agents(download_count);
CREATE INDEX IF NOT EXISTS idx_agents_config ON agents USING gin(config);

-- Recreate constraints (if they existed)
-- Note: Exact constraint structure may need adjustment based on original schema

-- Note: Backup table is kept for safety - remove manually if desired
-- DROP TABLE IF EXISTS agents_backup_cleanup_20250729;

COMMIT;

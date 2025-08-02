-- ROLLBACK: 20250618000000_credential_profiles.sql
-- Removes credential profiles system

BEGIN;

-- Drop policies
DROP POLICY IF EXISTS credential_profiles_user_access ON user_mcp_credential_profiles;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_ensure_single_default_profile ON user_mcp_credential_profiles;
DROP TRIGGER IF EXISTS trigger_update_credential_profile_timestamp ON user_mcp_credential_profiles;

-- Drop functions
DROP FUNCTION IF EXISTS ensure_single_default_profile();
DROP FUNCTION IF EXISTS update_credential_profile_timestamp();

-- Remove column from workflows
ALTER TABLE workflows DROP COLUMN IF EXISTS mcp_credential_mappings;

-- Drop indexes
DROP INDEX IF EXISTS idx_credential_profiles_account_mcp;
DROP INDEX IF EXISTS idx_credential_profiles_account_active;
DROP INDEX IF EXISTS idx_credential_profiles_default;

-- Drop table
DROP TABLE IF EXISTS user_mcp_credential_profiles CASCADE;

COMMIT;

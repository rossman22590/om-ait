-- ROLLBACK: 20250729120000_api_keys.sql
-- Removes API keys authentication system

BEGIN;

-- Drop policies
DROP POLICY IF EXISTS "Users can view their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can create their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Service role can manage all API keys" ON api_keys;

-- Drop indexes
DROP INDEX IF EXISTS idx_api_keys_account_id;
DROP INDEX IF EXISTS idx_api_keys_key_hash;
DROP INDEX IF EXISTS idx_api_keys_status;
DROP INDEX IF EXISTS idx_api_keys_created_at;
DROP INDEX IF EXISTS idx_api_keys_last_used_at;

-- Drop table
DROP TABLE IF EXISTS api_keys CASCADE;

-- Drop enum
DROP TYPE IF EXISTS api_key_status;

COMMIT;

-- ROLLBACK: 20250722031718_agent_metadata.sql
-- Removes agent metadata system

BEGIN;

-- Drop policies that use metadata
DROP POLICY IF EXISTS agents_update_own ON agents;
DROP POLICY IF EXISTS agents_delete_own ON agents;

-- Revoke function permissions
REVOKE EXECUTE ON FUNCTION is_suna_default_agent(agents) FROM authenticated, service_role;
REVOKE EXECUTE ON FUNCTION is_centrally_managed_agent(agents) FROM authenticated, service_role;
REVOKE EXECUTE ON FUNCTION get_agent_restrictions(agents) FROM authenticated, service_role;

-- Drop functions
DROP FUNCTION IF EXISTS is_suna_default_agent(agents);
DROP FUNCTION IF EXISTS is_centrally_managed_agent(agents);
DROP FUNCTION IF EXISTS get_agent_restrictions(agents);

-- Drop indexes
DROP INDEX IF EXISTS idx_agents_metadata;
DROP INDEX IF EXISTS idx_agents_suna_default;
DROP INDEX IF EXISTS idx_agents_centrally_managed;
DROP INDEX IF EXISTS idx_agents_suna_default_unique;

-- Remove metadata column
ALTER TABLE agents DROP COLUMN IF EXISTS metadata;

COMMIT;

-- ROLLBACK: 20250722034729_default_agent.sql
-- Removes Suna default agent management functions

BEGIN;

-- Revoke function permissions
REVOKE EXECUTE ON FUNCTION find_suna_default_agent_for_account(UUID) FROM authenticated, service_role;
REVOKE EXECUTE ON FUNCTION get_all_suna_default_agents() FROM authenticated, service_role;
REVOKE EXECUTE ON FUNCTION count_suna_agents_by_version(TEXT) FROM authenticated, service_role;
REVOKE EXECUTE ON FUNCTION get_suna_default_agent_stats() FROM authenticated, service_role;
REVOKE EXECUTE ON FUNCTION find_suna_agents_needing_update(TEXT) FROM authenticated, service_role;

-- Drop functions
DROP FUNCTION IF EXISTS find_suna_default_agent_for_account(UUID);
DROP FUNCTION IF EXISTS get_all_suna_default_agents();
DROP FUNCTION IF EXISTS count_suna_agents_by_version(TEXT);
DROP FUNCTION IF EXISTS get_suna_default_agent_stats();
DROP FUNCTION IF EXISTS find_suna_agents_needing_update(TEXT);

COMMIT;

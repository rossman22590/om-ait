-- ROLLBACK: 20250729105030_fix_agentpress_tools_sanitization.sql
-- Removes AgentPress tools sanitization function

BEGIN;

-- Revoke function permissions
REVOKE EXECUTE ON FUNCTION sanitize_agentpress_tools(JSONB) FROM authenticated, service_role;

-- Drop the sanitization function
DROP FUNCTION IF EXISTS sanitize_agentpress_tools(JSONB);

-- Note: This rollback removes the sanitization function but does not
-- reverse any data changes that may have been applied using this function.
-- If data was sanitized using this function, manual data restoration
-- from backup may be required.

COMMIT;

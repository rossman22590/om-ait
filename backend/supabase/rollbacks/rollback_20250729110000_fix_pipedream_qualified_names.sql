-- ROLLBACK: 20250729110000_fix_pipedream_qualified_names.sql
-- Removes Pipedream qualified names fix function

BEGIN;

-- Revoke function permissions
REVOKE EXECUTE ON FUNCTION fix_pipedream_qualified_names(JSONB) FROM authenticated, service_role;

-- Drop the fix function
DROP FUNCTION IF EXISTS fix_pipedream_qualified_names(JSONB);

-- Note: This rollback removes the function but does not reverse any data changes
-- that were applied to agent_templates. If you need to restore the original
-- Pipedream MCP names, you would need to:
-- 1. Restore from backup, or
-- 2. Manually update the config data to restore original names

-- The original UPDATE statement that was executed:
-- UPDATE agent_templates 
-- SET config = fix_pipedream_qualified_names(config)
-- WHERE config->'tools'->'custom_mcp' @> '[{"type": "pipedream"}]';

-- To reverse this, you would need the original MCP names before the fix was applied.

COMMIT;

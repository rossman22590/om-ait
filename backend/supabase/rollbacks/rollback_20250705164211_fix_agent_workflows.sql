-- ROLLBACK: 20250705164211_fix_agent_workflows.sql
-- Reverts workflow constraint and policy fixes

BEGIN;

-- Remove triggers
DROP TRIGGER IF EXISTS update_agent_workflows_updated_at ON agent_workflows;
DROP TRIGGER IF EXISTS update_workflow_steps_updated_at ON workflow_steps;

-- Remove the update function (if it was created by this migration)
DROP FUNCTION IF EXISTS update_updated_at_timestamp();

-- Note: Foreign key constraint changes cannot be easily rolled back
-- without knowing the exact original constraint names and definitions.
-- Manual intervention may be required to restore original constraints.

COMMIT;

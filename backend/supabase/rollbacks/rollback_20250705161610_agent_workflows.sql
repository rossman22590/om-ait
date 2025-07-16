BEGIN;

-- Drop all workflow-related tables in correct order (reverse of creation)
DROP TABLE IF EXISTS workflow_step_executions CASCADE;
DROP TABLE IF EXISTS workflow_executions CASCADE;
DROP TABLE IF EXISTS workflow_steps CASCADE;
DROP TABLE IF EXISTS agent_workflows CASCADE;

-- Drop the enum types
DROP TYPE IF EXISTS workflow_execution_status CASCADE;
DROP TYPE IF EXISTS workflow_step_type CASCADE;
DROP TYPE IF EXISTS agent_workflow_status CASCADE;

-- Drop the update function if it was created by this migration
-- (Note: Only drop if no other tables are using it)
-- DROP FUNCTION IF EXISTS update_updated_at_column();

COMMIT; 
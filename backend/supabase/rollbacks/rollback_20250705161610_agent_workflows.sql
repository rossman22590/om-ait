-- ROLLBACK: 20250705161610_agent_workflows.sql
-- Removes agent workflow system

BEGIN;

-- Drop triggers
DROP TRIGGER IF EXISTS update_agent_workflows_updated_at ON agent_workflows;
DROP TRIGGER IF EXISTS update_workflow_steps_updated_at ON workflow_steps;
DROP TRIGGER IF EXISTS update_workflow_executions_updated_at ON workflow_executions;
DROP TRIGGER IF EXISTS update_workflow_step_executions_updated_at ON workflow_step_executions;

-- Drop policies
DROP POLICY IF EXISTS "Users can view workflows for their agents" ON agent_workflows;
DROP POLICY IF EXISTS "Users can create workflows for their agents" ON agent_workflows;
DROP POLICY IF EXISTS "Users can update workflows for their agents" ON agent_workflows;
DROP POLICY IF EXISTS "Users can delete workflows for their agents" ON agent_workflows;
DROP POLICY IF EXISTS "Service role can manage workflows" ON agent_workflows;

DROP POLICY IF EXISTS "Users can view steps for their workflows" ON workflow_steps;
DROP POLICY IF EXISTS "Users can create steps for their workflows" ON workflow_steps;
DROP POLICY IF EXISTS "Users can update steps for their workflows" ON workflow_steps;
DROP POLICY IF EXISTS "Users can delete steps for their workflows" ON workflow_steps;
DROP POLICY IF EXISTS "Service role can manage workflow steps" ON workflow_steps;

DROP POLICY IF EXISTS "Users can view executions for their workflows" ON workflow_executions;
DROP POLICY IF EXISTS "Service role can manage executions" ON workflow_executions;

DROP POLICY IF EXISTS "Users can view step executions for their workflows" ON workflow_step_executions;
DROP POLICY IF EXISTS "Service role can manage step executions" ON workflow_step_executions;

-- Drop indexes
DROP INDEX IF EXISTS idx_agent_workflows_agent_id;
DROP INDEX IF EXISTS idx_agent_workflows_status;
DROP INDEX IF EXISTS idx_agent_workflows_is_default;
DROP INDEX IF EXISTS idx_agent_workflows_trigger_phrase;

DROP INDEX IF EXISTS idx_workflow_steps_workflow_id;
DROP INDEX IF EXISTS idx_workflow_steps_type;
DROP INDEX IF EXISTS idx_workflow_steps_order;

DROP INDEX IF EXISTS idx_workflow_executions_workflow_id;
DROP INDEX IF EXISTS idx_workflow_executions_agent_id;
DROP INDEX IF EXISTS idx_workflow_executions_thread_id;
DROP INDEX IF EXISTS idx_workflow_executions_status;
DROP INDEX IF EXISTS idx_workflow_executions_started_at;

DROP INDEX IF EXISTS idx_workflow_step_executions_execution_id;
DROP INDEX IF EXISTS idx_workflow_step_executions_step_id;
DROP INDEX IF EXISTS idx_workflow_step_executions_status;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS workflow_step_executions CASCADE;
DROP TABLE IF EXISTS workflow_executions CASCADE;
DROP TABLE IF EXISTS workflow_steps CASCADE;
DROP TABLE IF EXISTS agent_workflows CASCADE;

-- Drop enums
DROP TYPE IF EXISTS workflow_execution_status;
DROP TYPE IF EXISTS workflow_step_type;
DROP TYPE IF EXISTS agent_workflow_status;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_timestamp();

COMMIT;

-- ROLLBACK: 20250723093053_fix_workflow_policy_conflicts.sql
-- Recreates the workflow policies and triggers that were dropped

BEGIN;

-- Note: This rollback recreates basic policies, but the exact original policies
-- may have been different. Manual review may be needed.

-- Recreate basic workflow policies
CREATE POLICY "Users can view workflows for their agents" ON agent_workflows
    FOR SELECT USING (
        agent_id IN (
            SELECT agent_id FROM agents 
            WHERE account_id IN (
                SELECT account_id FROM basejump.account_user 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create workflows for their agents" ON agent_workflows
    FOR INSERT WITH CHECK (
        agent_id IN (
            SELECT agent_id FROM agents 
            WHERE account_id IN (
                SELECT account_id FROM basejump.account_user 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update workflows for their agents" ON agent_workflows
    FOR UPDATE USING (
        agent_id IN (
            SELECT agent_id FROM agents 
            WHERE account_id IN (
                SELECT account_id FROM basejump.account_user 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete workflows for their agents" ON agent_workflows
    FOR DELETE USING (
        agent_id IN (
            SELECT agent_id FROM agents 
            WHERE account_id IN (
                SELECT account_id FROM basejump.account_user 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Recreate triggers (if update_updated_at_timestamp function exists)
CREATE TRIGGER update_agent_workflows_updated_at
    BEFORE UPDATE ON agent_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_timestamp();

CREATE TRIGGER update_workflow_steps_updated_at
    BEFORE UPDATE ON workflow_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_timestamp();

COMMIT;

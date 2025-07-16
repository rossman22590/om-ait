BEGIN;

-- Rollback: Remove default value from workflow_steps type column
ALTER TABLE workflow_steps ALTER COLUMN type DROP DEFAULT;

-- Note: This rollback cannot undo the UPDATE statement that changed existing records
-- If you need to restore original values, you would need a backup

COMMIT; 
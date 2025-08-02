-- ROLLBACK: 20250706130554_simplify_workflow_steps.sql
-- Removes 'instruction' from workflow_step_type enum

BEGIN;

-- Note: Removing enum values is complex and risky if data exists using that value
-- This rollback will only work if no workflow steps use the 'instruction' type

-- Check if any workflow steps use 'instruction' type
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM workflow_steps WHERE type = 'instruction') THEN
        RAISE EXCEPTION 'Cannot rollback: workflow steps exist with type ''instruction''';
    END IF;
END $$;

-- Remove 'instruction' from enum (PostgreSQL doesn't support direct enum value removal)
-- We need to recreate the enum without 'instruction'
ALTER TYPE workflow_step_type RENAME TO workflow_step_type_old;

CREATE TYPE workflow_step_type AS ENUM ('action', 'condition');

-- Update any tables using the enum (if they exist)
ALTER TABLE workflow_steps 
    ALTER COLUMN type TYPE workflow_step_type 
    USING type::text::workflow_step_type;

DROP TYPE workflow_step_type_old;

COMMIT;

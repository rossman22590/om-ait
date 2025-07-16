BEGIN;

-- WARNING: PostgreSQL does not support removing values from ENUM types directly
-- This rollback would require recreating the enum type without the 'instruction' value
-- and updating all references. This is complex and risky.

-- To properly rollback, you would need to:
-- 1. Create a new enum type without 'instruction'
-- 2. Update all columns using the old enum to use the new one
-- 3. Drop the old enum type
-- 4. Rename the new enum type to the original name

-- For safety, this rollback is left as a comment with instructions
-- If you need to remove 'instruction' from workflow_step_type, contact your DBA

/*
-- Step 1: Create new enum without 'instruction'
CREATE TYPE workflow_step_type_new AS ENUM ('message', 'tool_call', 'condition', 'loop', 'wait', 'input', 'output');

-- Step 2: Update columns (this would fail if any records have 'instruction' type)
ALTER TABLE workflow_steps ALTER COLUMN type TYPE workflow_step_type_new USING type::text::workflow_step_type_new;

-- Step 3: Drop old enum
DROP TYPE workflow_step_type;

-- Step 4: Rename new enum
ALTER TYPE workflow_step_type_new RENAME TO workflow_step_type;
*/

-- Since this is complex and potentially destructive, we recommend not rolling back this change
-- unless absolutely necessary and with proper backup procedures

COMMIT; 
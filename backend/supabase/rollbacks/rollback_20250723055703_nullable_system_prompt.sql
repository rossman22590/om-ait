-- ROLLBACK: 20250723055703_nullable_system_prompt.sql
-- Makes system_prompt NOT NULL again and restores Suna agent prompts

BEGIN;

-- First, we need to set a default value for any NULL system_prompts
-- before making the column NOT NULL
UPDATE agents 
SET system_prompt = 'Default system prompt' 
WHERE system_prompt IS NULL;

-- Make system_prompt NOT NULL again
ALTER TABLE agents 
ALTER COLUMN system_prompt SET NOT NULL;

COMMIT;

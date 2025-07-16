BEGIN;

-- Drop the tables in reverse order of creation
DROP TABLE IF EXISTS oauth_installations CASCADE;
DROP TABLE IF EXISTS custom_trigger_providers CASCADE;
DROP TABLE IF EXISTS trigger_events CASCADE;
DROP TABLE IF EXISTS agent_triggers CASCADE;

-- Drop the enum type
DROP TYPE IF EXISTS agent_trigger_type CASCADE;

-- Drop the update function only if it was created by this migration
-- (Note: Other migrations might also use this function, so be careful)
-- DROP FUNCTION IF EXISTS update_updated_at_column();

COMMIT; 
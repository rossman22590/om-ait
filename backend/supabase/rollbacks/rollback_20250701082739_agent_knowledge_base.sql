BEGIN;

-- Drop the functions
DROP FUNCTION IF EXISTS get_agent_knowledge_base(UUID, BOOLEAN);
DROP FUNCTION IF EXISTS get_agent_knowledge_base_context(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_combined_knowledge_base_context(UUID, UUID, INTEGER);

-- Drop the trigger functions
DROP FUNCTION IF EXISTS update_agent_kb_entry_timestamp();
DROP FUNCTION IF EXISTS calculate_agent_kb_entry_tokens();

-- Drop the tables
DROP TABLE IF EXISTS agent_knowledge_base_usage_log CASCADE;
DROP TABLE IF EXISTS agent_knowledge_base_entries CASCADE;

COMMIT; 